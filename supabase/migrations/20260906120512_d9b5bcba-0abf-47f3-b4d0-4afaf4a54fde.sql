
CREATE TABLE public.listing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('view','click_phone','click_whatsapp','click_message','favorite','share')),
  visitor_key text NOT NULL,
  user_id uuid,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX listing_events_dedup
  ON public.listing_events (listing_id, kind, visitor_key, day);
CREATE INDEX listing_events_owner_day ON public.listing_events (owner_id, day);
CREATE INDEX listing_events_listing_kind ON public.listing_events (listing_id, kind);

GRANT SELECT ON public.listing_events TO authenticated;
GRANT ALL ON public.listing_events TO service_role;

ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_events_owner_read ON public.listing_events
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.record_listing_event(
  _listing_id uuid,
  _kind text,
  _visitor_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _inserted boolean := false;
BEGIN
  IF _kind NOT IN ('view','click_phone','click_whatsapp','click_message','favorite','share') THEN
    RETURN;
  END IF;
  IF _visitor_key IS NULL OR length(_visitor_key) < 8 OR length(_visitor_key) > 128 THEN
    RETURN;
  END IF;

  SELECT owner_id INTO _owner FROM public.listings WHERE id = _listing_id;
  IF _owner IS NULL THEN RETURN; END IF;

  -- Le propriétaire ne gonfle pas ses propres statistiques
  IF auth.uid() IS NOT NULL AND auth.uid() = _owner THEN RETURN; END IF;

  INSERT INTO public.listing_events (listing_id, owner_id, kind, visitor_key, user_id)
  VALUES (_listing_id, _owner, _kind, _visitor_key, auth.uid())
  ON CONFLICT (listing_id, kind, visitor_key, day) DO NOTHING;

  GET DIAGNOSTICS _inserted = ROW_COUNT;

  IF _inserted AND _kind = 'view' THEN
    PERFORM set_config('app.bypass_listing_protection', 'on', true);
    UPDATE public.listings
       SET views_count = views_count + 1
     WHERE id = _listing_id;
    PERFORM set_config('app.bypass_listing_protection', 'off', true);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_listing_event(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_listing_event(uuid, text, text) TO anon, authenticated;

-- Statistiques agrégées du vendeur connecté (30 derniers jours)
CREATE OR REPLACE FUNCTION public.get_my_listing_stats(_days integer DEFAULT 30)
RETURNS TABLE(day date, views integer, contacts integer, favorites integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.day,
         COUNT(*) FILTER (WHERE e.kind = 'view')::int,
         COUNT(*) FILTER (WHERE e.kind IN ('click_phone','click_whatsapp','click_message'))::int,
         COUNT(*) FILTER (WHERE e.kind = 'favorite')::int
  FROM public.listing_events e
  WHERE e.owner_id = auth.uid()
    AND e.day >= ((now() AT TIME ZONE 'utc')::date - GREATEST(COALESCE(_days, 30), 1))
  GROUP BY e.day
  ORDER BY e.day;
$$;

REVOKE ALL ON FUNCTION public.get_my_listing_stats(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_listing_stats(integer) TO authenticated;

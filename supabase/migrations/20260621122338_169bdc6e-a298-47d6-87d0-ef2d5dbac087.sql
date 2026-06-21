
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz,
  failure_count int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_push_sub_select" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_push_sub_insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_push_sub_update" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_push_sub_delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.push_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_send_log_lookup ON public.push_send_log(user_id, listing_id, kind, sent_at DESC);
GRANT SELECT ON public.push_send_log TO authenticated;
GRANT ALL ON public.push_send_log TO service_role;
ALTER TABLE public.push_send_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_push_log_select" ON public.push_send_log FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_no_self CHECK (seller_id <> author_id),
  CONSTRAINT reviews_unique_per_author UNIQUE (seller_id, author_id, listing_id)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_author_insert" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND author_id <> seller_id);
CREATE POLICY "reviews_author_update" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "reviews_author_delete" ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX reviews_seller_created_idx ON public.reviews (seller_id, created_at DESC);

CREATE TRIGGER reviews_set_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_seller_rating(_seller_id UUID)
RETURNS TABLE(avg_rating NUMERIC, total INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)::NUMERIC, COUNT(*)::INT
  FROM public.reviews WHERE seller_id = _seller_id
$$;

-- ============ KYC ============
CREATE TABLE public.kyc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('cni','passport','license')),
  doc_number TEXT NOT NULL,
  doc_country TEXT NOT NULL,
  doc_front_path TEXT NOT NULL,
  doc_back_path TEXT,
  selfie_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyc_self_read" ON public.kyc_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "kyc_self_insert" ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "kyc_admin_update" ON public.kyc_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "kyc_self_delete_pending" ON public.kyc_submissions FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE INDEX kyc_user_created_idx ON public.kyc_submissions (user_id, created_at DESC);
CREATE INDEX kyc_pending_idx ON public.kyc_submissions (status) WHERE status = 'pending';

CREATE TRIGGER kyc_set_updated BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.on_kyc_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles SET verified = true, verified_at = now() WHERE id = NEW.user_id;
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER kyc_on_approved BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.on_kyc_approved();

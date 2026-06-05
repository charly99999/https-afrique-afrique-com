
-- 1) Profiles: drop blanket public read, lock anon to the safe view only
DROP POLICY IF EXISTS profiles_public_safe_read ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2) Payments: defence-in-depth WITH CHECK on insert
DROP POLICY IF EXISTS payments_self_insert ON public.payments;
CREATE POLICY payments_self_insert ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND completed_at IS NULL
    AND provider_token IS NULL
    AND provider_response IS NULL
    AND provider_invoice_url IS NULL
  );

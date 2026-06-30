
-- Lock down internal trigger functions: they only need to run inside triggers, never via the API.
REVOKE EXECUTE ON FUNCTION public.protect_listing_sensitive_cols() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_message_cols() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_verified_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_review_keys() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_lifetime_business() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_payment_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_admin_role_granted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_kyc_approved() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_listings_bucket_path(text) FROM PUBLIC, anon, authenticated;

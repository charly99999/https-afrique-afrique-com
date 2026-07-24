
-- Ensure boosted_until cannot be self-escalated by owners
DROP TRIGGER IF EXISTS trg_protect_listing_sensitive_cols ON public.listings;
CREATE TRIGGER trg_protect_listing_sensitive_cols
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.protect_listing_sensitive_cols();

DROP TRIGGER IF EXISTS trg_auto_boost_on_insert ON public.listings;
CREATE TRIGGER trg_auto_boost_on_insert
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.auto_boost_on_insert();

-- Restrict recipient updates on messages to only the read_at column
DROP TRIGGER IF EXISTS trg_protect_message_cols ON public.messages;
CREATE TRIGGER trg_protect_message_cols
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_cols();

ALTER TABLE public.listings
  ADD CONSTRAINT listings_owner_profile_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
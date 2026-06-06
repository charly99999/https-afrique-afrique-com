
DROP POLICY IF EXISTS listings_owner_insert ON storage.objects;
DROP POLICY IF EXISTS listings_owner_update ON storage.objects;
DROP POLICY IF EXISTS listings_owner_delete ON storage.objects;

CREATE POLICY listings_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id::text = (storage.foldername(name))[2]
        AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY listings_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id::text = (storage.foldername(name))[2]
        AND l.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id::text = (storage.foldername(name))[2]
        AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY listings_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id::text = (storage.foldername(name))[2]
        AND l.owner_id = auth.uid()
    )
  );

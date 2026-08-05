-- Allow the app's anon key to upload and read shift-start photos in the
-- "shift-photos" storage bucket. Scoped strictly to this bucket — no other
-- buckets are affected, and no elevated (service_role) access is granted.

DROP POLICY IF EXISTS "shift-photos anon insert" ON storage.objects;
CREATE POLICY "shift-photos anon insert"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'shift-photos');

DROP POLICY IF EXISTS "shift-photos anon select" ON storage.objects;
CREATE POLICY "shift-photos anon select"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'shift-photos');

-- Needed because the app uploads with { upsert: true }, which performs an
-- UPDATE when a file with the same name already exists.
DROP POLICY IF EXISTS "shift-photos anon update" ON storage.objects;
CREATE POLICY "shift-photos anon update"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'shift-photos')
WITH CHECK (bucket_id = 'shift-photos');

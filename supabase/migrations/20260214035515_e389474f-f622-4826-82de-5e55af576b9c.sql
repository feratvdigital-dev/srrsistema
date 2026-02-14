-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Allow anyone to read photos (they're public)
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Allow anyone to upload photos (tickets are public, orders require auth)
CREATE POLICY "Allow uploads to photos bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- Allow updates
CREATE POLICY "Allow updates to photos bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'photos');

-- Allow deletes
CREATE POLICY "Allow deletes from photos bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');

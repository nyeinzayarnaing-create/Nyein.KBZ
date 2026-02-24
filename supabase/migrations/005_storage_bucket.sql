-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to candidate photos
CREATE POLICY "Public read access for candidate photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-photos');

-- Allow authenticated/service role to upload candidate photos
CREATE POLICY "Allow upload candidate photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-photos');

-- Allow update candidate photos
CREATE POLICY "Allow update candidate photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'candidate-photos')
WITH CHECK (bucket_id = 'candidate-photos');

-- Allow delete candidate photos
CREATE POLICY "Allow delete candidate photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'candidate-photos');

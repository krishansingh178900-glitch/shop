-- ==============================================================================
-- SKYLIX Salon - Supabase Database Schema & Storage Configuration
-- Version: 1.0.0
-- Local Website: http://localhost:3000/
-- Local Admin:   http://localhost:3000/admin/
-- ==============================================================================

-- 1. Create Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Signature Cuts',
    description TEXT,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for speedy queries by category and creation date
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_featured ON public.gallery(is_featured);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for `gallery`
-- Drop existing policies if re-running script
DROP POLICY IF EXISTS "Public Read Gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admin Insert Gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admin Update Gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admin Delete Gallery" ON public.gallery;

-- A. Anyone (anonymous visitors and authenticated admins) can view gallery images
CREATE POLICY "Public Read Gallery"
ON public.gallery
FOR SELECT
USING (true);

-- B. Only authenticated administrators can upload/insert new gallery records
CREATE POLICY "Admin Insert Gallery"
ON public.gallery
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- C. Only authenticated administrators can update gallery records
CREATE POLICY "Admin Update Gallery"
ON public.gallery
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- D. Only authenticated administrators can delete gallery records
CREATE POLICY "Admin Delete Gallery"
ON public.gallery
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 4. Supabase Storage Setup (Bucket: gallery-images)
-- ==============================================================================

-- Create public storage bucket for salon photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery-images',
    'gallery-images',
    true,
    10485760, -- 10 MB maximum per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 5. Storage RLS Policies
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public View Gallery Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Gallery Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Gallery Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Gallery Images" ON storage.objects;

-- A. Anyone can view/download images stored in the public 'gallery-images' bucket
CREATE POLICY "Public View Gallery Images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery-images');

-- B. Only authenticated administrators can upload photos into the 'gallery-images' bucket
CREATE POLICY "Admin Upload Gallery Images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

-- C. Only authenticated administrators can update photos in the 'gallery-images' bucket
CREATE POLICY "Admin Update Gallery Images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

-- D. Only authenticated administrators can delete photos from the 'gallery-images' bucket
CREATE POLICY "Admin Delete Gallery Images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

-- ==============================================================================
-- 6. Instructions for Creating First Admin User:
--
-- Go to your Supabase Dashboard:
-- 1. Navigate to: Authentication -> Users -> Add User -> Create User
-- 2. Enter admin email (e.g. admin@skylixsalon.com) and a strong password.
-- 3. Confirm email: Check "Auto Confirm User?" so the email is immediately verified.
-- 4. Use these credentials to sign in at /admin!
-- ==============================================================================

-- Create storage bucket for story videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-videos',
  'story-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
);

-- Create story_videos table
CREATE TABLE public.story_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  district TEXT,
  role TEXT,
  duration_seconds INTEGER,
  approved BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view approved story videos"
ON public.story_videos
FOR SELECT
USING (approved = true);

CREATE POLICY "Temporary: Allow anonymous video submissions for testing"
ON public.story_videos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own story videos"
ON public.story_videos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own story videos"
ON public.story_videos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own story videos"
ON public.story_videos
FOR UPDATE
USING (auth.uid() = user_id);

-- Storage policies for story-videos bucket
CREATE POLICY "Public can view story videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'story-videos');

CREATE POLICY "Authenticated users can upload story videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'story-videos' AND
  (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Users can update own story videos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'story-videos' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'anon')
);

CREATE POLICY "Users can delete own story videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'story-videos' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'anon')
);

-- Trigger for updated_at
CREATE TRIGGER update_story_videos_updated_at
BEFORE UPDATE ON public.story_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_story_videos_approved ON public.story_videos(approved, created_at DESC);
CREATE INDEX idx_story_videos_user ON public.story_videos(user_id);
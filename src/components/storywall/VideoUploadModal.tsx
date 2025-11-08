import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Video, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function VideoUploadModal({ open, onClose }: VideoUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    district: "",
    role: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please select a valid video file");
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be less than 100MB");
      return;
    }

    setVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      toast.error("Please select a video");
      return;
    }

    if (!formData.title || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Generate temp user ID (in production, use auth.uid())
      const tempUserId = localStorage.getItem('temp_user_id') || 
        (() => {
          const id = crypto.randomUUID();
          localStorage.setItem('temp_user_id', id);
          return id;
        })();

      // Upload video to storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${tempUserId}/${Date.now()}.${fileExt}`;
      
      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story-videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload video");
        return;
      }

      setUploadProgress(70);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-videos')
        .getPublicUrl(fileName);

      setUploadProgress(80);

      // Create database record
      const { error: dbError } = await supabase
        .from('story_videos')
        .insert({
          user_id: tempUserId,
          video_url: publicUrl,
          title: formData.title,
          message: formData.message,
          district: formData.district || null,
          role: formData.role || null,
          approved: true, // Auto-approve for testing
        });

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error("Failed to save video");
        return;
      }

      setUploadProgress(100);

      toast.success("Video uploaded successfully! It will appear on the wall shortly.");
      
      // Reset form
      setFormData({ title: "", message: "", district: "", role: "" });
      setVideoFile(null);
      onClose();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Share Your Story
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload */}
          <div className="space-y-2">
            <Label htmlFor="video">Video *</Label>
            <div className="relative">
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
              {videoFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Max 100MB. MP4, WebM, QuickTime formats supported.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Why I'm Speaking Up"
              disabled={uploading}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.title.length}/100
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Share your story and why educators need to take action..."
              disabled={uploading}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.message.length}/500
            </p>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="district">District (Optional)</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g., Toronto DSB"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role (Optional)</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., High School Teacher"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-semibold">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !videoFile}
              className="flex-1 gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

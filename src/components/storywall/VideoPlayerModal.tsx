import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StoryVideo {
  id: string;
  video_url: string;
  title: string;
  message: string;
  district: string | null;
  role: string | null;
  views: number;
  created_at: string;
}

interface VideoPlayerModalProps {
  video: StoryVideo;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, open, onClose }: VideoPlayerModalProps) {
  useEffect(() => {
    if (open) {
      // Increment view count
      incrementViews();
    }
  }, [open]);

  const incrementViews = async () => {
    try {
      await supabase
        .from('story_videos')
        .update({ views: video.views + 1 })
        .eq('id', video.id);
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{video.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              controls
              autoPlay
              className="w-full h-full"
              src={video.video_url}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2">
            {video.district && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {video.district}
              </Badge>
            )}
            {video.role && (
              <Badge variant="outline" className="gap-1">
                <Briefcase className="w-3 h-3" />
                {video.role}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 ml-auto">
              <Eye className="w-3 h-3" />
              {video.views.toLocaleString()} views
            </Badge>
          </div>

          {/* Message */}
          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground leading-relaxed">
              {video.message}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

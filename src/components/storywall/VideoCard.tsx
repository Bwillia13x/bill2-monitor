import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, MapPin, Briefcase } from "lucide-react";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface StoryVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string;
  message: string;
  district: string | null;
  role: string | null;
  views: number;
  created_at: string;
}

interface VideoCardProps {
  video: StoryVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  const [playerOpen, setPlayerOpen] = useState(false);

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card 
        className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 bg-gradient-to-br from-background to-primary/5"
        onClick={() => setPlayerOpen(true)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-primary/40" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>

          {/* Views badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-full text-xs text-white">
            <Eye className="w-3 h-3" />
            <span className="font-semibold">{formatViews(video.views)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.message}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
            {video.district && (
              <Badge variant="secondary" className="text-xs gap-1">
                <MapPin className="w-3 h-3" />
                {video.district}
              </Badge>
            )}
            {video.role && (
              <Badge variant="outline" className="text-xs gap-1">
                <Briefcase className="w-3 h-3" />
                {video.role}
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(video.created_at)}
            </span>
          </div>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-lg border-2 border-primary/0 group-hover:border-primary/50 transition-colors duration-300 pointer-events-none" />
      </Card>

      <VideoPlayerModal
        video={video}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </>
  );
}

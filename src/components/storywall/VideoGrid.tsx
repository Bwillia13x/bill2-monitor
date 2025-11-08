import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard } from "./VideoCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface VideoGridProps {
  filter: "all" | "recent" | "popular";
}

export function VideoGrid({ filter }: VideoGridProps) {
  const [videos, setVideos] = useState<StoryVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('story-videos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_videos',
          filter: 'approved=eq.true'
        },
        (payload) => {
          console.log('New video added:', payload);
          setVideos(prev => [payload.new as StoryVideo, ...prev]);
          toast.success("New story added to the wall!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('story_videos')
        .select('*')
        .eq('approved', true);

      if (filter === "recent") {
        query = query.order('created_at', { ascending: false });
      } else if (filter === "popular") {
        query = query.order('views', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error("Error fetching videos:", error);
        toast.error("Failed to load videos");
        return;
      }

      setVideos(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">
          No stories yet. Be the first to share yours!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

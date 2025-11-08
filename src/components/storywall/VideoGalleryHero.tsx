import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, Upload, ArrowRight, Loader2 } from "lucide-react";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { useNavigate } from "react-router-dom";
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

interface VideoGalleryHeroProps {
  onUploadClick: () => void;
}

export function VideoGalleryHero({ onUploadClick }: VideoGalleryHeroProps) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<StoryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<StoryVideo | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    fetchVideos();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('hero-video-updates')
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
          setVideos(prev => [payload.new as StoryVideo, ...prev.slice(0, 8)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('story_videos')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(9);

      if (error) {
        console.error("Error fetching videos:", error);
        return;
      }

      setVideos(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: StoryVideo) => {
    setSelectedVideo(video);
    setPlayerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-primary/5 to-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <section className="relative min-h-screen flex flex-col bg-gradient-to-b from-background via-primary/5 to-background">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-top-4 duration-1000">
              Teacher Voices Rising
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto animate-in fade-in slide-in-from-top-6 duration-1000 delay-200">
              Watch real educators share their stories. Add your voice to the movement.
            </p>
          </div>

          {/* Video Grid - 3x3 */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {videos.slice(0, 9).map((video, idx) => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br from-primary/20 to-primary/5 hover:scale-[1.02] transition-all duration-300 animate-in fade-in zoom-in"
                style={{ animationDelay: `${idx * 50}ms`, animationDuration: '500ms' }}
              >
                {/* Thumbnail or gradient */}
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-primary/10" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-2xl">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary group-hover:text-white ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 drop-shadow-lg">
                    {video.title}
                  </h3>
                  {video.district && (
                    <p className="text-xs text-white/80 mt-1 drop-shadow">
                      {video.district}
                    </p>
                  )}
                </div>

                {/* Hover border effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-primary/0 group-hover:border-primary/60 transition-colors duration-300 pointer-events-none" />
              </div>
            ))}

            {/* Fill empty slots if less than 9 videos */}
            {Array.from({ length: Math.max(0, 9 - videos.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="aspect-video rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center"
              >
                <p className="text-muted-foreground text-sm">Coming soon</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onUploadClick}
              size="lg"
              className="gap-2 text-lg px-8 py-6 group shadow-lg hover:shadow-primary/50 transition-shadow"
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Share Your Story
            </Button>
            
            <Button
              onClick={() => navigate('/story-wall')}
              size="lg"
              variant="outline"
              className="gap-2 text-lg px-8 py-6 group"
            >
              View All Stories
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          open={playerOpen}
          onClose={() => {
            setPlayerOpen(false);
            setSelectedVideo(null);
          }}
        />
      )}
    </>
  );
}

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
      <section className="relative min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
        {/* Enhanced background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 space-y-6">
            {/* Overline */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wide animate-in fade-in slide-in-from-top-2 duration-700">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              LIVE STORIES FROM THE FRONTLINES
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tight animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="block bg-gradient-to-br from-white via-gray-100 to-gray-400 bg-clip-text text-transparent drop-shadow-2xl">
                Teacher Voices
              </span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-pulse">
                Rising
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-top-6 duration-1000 delay-200">
              Real educators. Real stories. <span className="text-primary font-bold">Real change.</span>
            </p>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in duration-1000 delay-300">
              Watch their stories, share yours, and amplify the movement for better classroom conditions
            </p>
          </div>

          {/* Video Grid - 3x3 with enhanced styling */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 mb-10 sm:mb-12">
            {videos.slice(0, 9).map((video, idx) => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video)}
                className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-primary/20 to-primary/5 hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 animate-in fade-in zoom-in shadow-xl hover:shadow-2xl hover:shadow-primary/30"
                style={{ animationDelay: `${idx * 50}ms`, animationDuration: '500ms' }}
              >
                {/* Thumbnail or gradient */}
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-primary/10" />
                )}

                {/* Enhanced overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-primary/50 transition-all duration-300" />

                {/* Play button with enhanced animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/30 animate-ping group-hover:animate-none" />
                    
                    {/* Main button */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center group-hover:scale-125 group-hover:bg-primary group-hover:rotate-90 transition-all duration-500 shadow-2xl">
                      <Play className="w-9 h-9 sm:w-11 sm:h-11 text-primary group-hover:text-white ml-1 transition-colors duration-300" fill="currentColor" />
                    </div>
                  </div>
                </div>

                {/* Enhanced info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 className="font-bold text-white text-base sm:text-lg line-clamp-2 drop-shadow-2xl mb-2">
                    {video.title}
                  </h3>
                  {video.district && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/90 drop-shadow">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {video.district}
                    </div>
                  )}
                </div>

                {/* Corner accent */}
                <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-primary/0 group-hover:border-primary/60 rounded-tr-2xl transition-all duration-500" />
              </div>
            ))}

            {/* Fill empty slots with enhanced styling */}
            {Array.from({ length: Math.max(0, 9 - videos.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="aspect-video rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Story Coming Soon</p>
              </div>
            ))}
          </div>

          {/* Enhanced CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6">
            <Button
              onClick={onUploadClick}
              size="lg"
              className="relative gap-3 text-lg px-10 py-7 group overflow-hidden shadow-2xl hover:shadow-primary/50 transition-all duration-300 rounded-xl font-bold"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
              <div className="relative flex items-center gap-3">
                <Upload className="w-5 h-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
                <span>Share Your Story</span>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/story-wall')}
              size="lg"
              variant="outline"
              className="gap-3 text-lg px-10 py-7 group border-2 hover:border-primary hover:bg-primary/10 transition-all duration-300 rounded-xl font-semibold"
            >
              <span>View All Stories</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </div>
        </div>

        {/* Enhanced scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce">
          <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Scroll for more</p>
          <div className="w-7 h-11 rounded-full border-2 border-primary/60 flex items-start justify-center p-2 shadow-lg shadow-primary/20">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
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

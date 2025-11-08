import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Play, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function StoryWallCTA() {
  const navigate = useNavigate();

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/40 p-6">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Story Wall</h3>
            <p className="text-sm text-muted-foreground">Real voices, real impact</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 py-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">47+</div>
            <div className="text-xs text-muted-foreground">Video Stories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">12K+</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </div>
        </div>

        {/* Preview thumbnails */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="aspect-video rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/story-wall')}
            >
              <Play className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-4 space-y-2">
          <Button 
            onClick={() => navigate('/story-wall')}
            className="w-full gap-2 group"
            size="lg"
          >
            <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Watch Stories & Share Yours
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Join educators sharing their experiences on camera
          </p>
        </div>
      </div>
    </Card>
  );
}

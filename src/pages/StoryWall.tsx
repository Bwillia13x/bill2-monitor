import { useState } from "react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { VideoGrid } from "@/components/storywall/VideoGrid";
import { VideoUploadModal } from "@/components/storywall/VideoUploadModal";
import { Button } from "@/components/ui/button";
import { Video, Upload, Filter } from "lucide-react";
import { SocialMetaTags } from "@/components/v3/SocialMetaTags";

const StoryWall = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "recent" | "popular">("recent");

  return (
    <>
      <SocialMetaTags 
        title="Story Wall - Teacher Voices"
        description="Watch educators share their real experiences and messages"
      />
      
      <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
        <BackgroundFX />
        <Header />
        <Banner />

        <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-10">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Video className="w-10 h-10 text-primary animate-pulse" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Story Wall
              </h1>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real voices. Real stories. Real change. Watch educators across the country share their experiences.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button 
                onClick={() => setUploadModalOpen(true)}
                size="lg"
                className="gap-2 group"
              >
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Share Your Story
              </Button>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-2">
                  {(["all", "recent", "popular"] as const).map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilter(f)}
                      className="capitalize"
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <VideoGrid filter={filter} />
        </main>

        {/* Upload Modal */}
        <VideoUploadModal 
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />

        {/* Footer */}
        <footer className="relative z-10 border-t border-border mt-16">
          <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Digital Strike.</span>
            <span>Evidence, not coordination. Privacy‑by‑design.</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default StoryWall;

import { Header } from "@/components/Header";
import { BackgroundFX } from "@/components/BackgroundFX";
import { ReferralDashboard } from "@/components/ReferralDashboard";
import { DailyPulse } from "@/components/DailyPulse";
import { BadgeSystem } from "@/components/BadgeSystem";
import { ProvinceHeatmap } from "@/components/ProvinceHeatmap";
import { GrowthTimelapse } from "@/components/GrowthTimelapse";
import { ShareableGenerator } from "@/components/ShareableGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MLALetterGenerator } from "@/components/MLALetterGenerator";
import { WeeklyChallenges } from "@/components/WeeklyChallenges";
import { EnhancedPressKit } from "@/components/EnhancedPressKit";
import { StorySubmission } from "@/components/StorySubmission";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";

const Engage = () => {
  return (
    <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
      <BackgroundFX band="amber" />
      <Header />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Amplify Your Impact</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your network growth, share your story, and help build the movement
          </p>
        </div>

        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="pulse">Pulse</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="story">Share Story</TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 mb-8 mt-2">
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="mla">Contact MLA</TabsTrigger>
            <TabsTrigger value="press">Press Kit</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="space-y-6">
            <ReferralDashboard />
          </TabsContent>

          <TabsContent value="pulse" className="space-y-6">
            <DailyPulse />
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <BadgeSystem />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <ProvinceHeatmap />
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <GrowthTimelapse />
          </TabsContent>

          <TabsContent value="share" className="space-y-6">
            <ShareableGenerator />
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <WeeklyChallenges />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <MilestoneCelebration currentCount={145} />
          </TabsContent>

          <TabsContent value="story" className="space-y-6">
            <StorySubmission />
          </TabsContent>

          <TabsContent value="mla" className="space-y-6">
            <MLALetterGenerator />
          </TabsContent>

          <TabsContent value="press" className="space-y-6">
            <EnhancedPressKit />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Digital Strike.</span>
          <span>Evidence, not coordination. Privacy‑by‑design.</span>
        </div>
      </footer>
    </div>
  );
};

export default Engage;

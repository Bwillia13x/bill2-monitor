import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { Countdown } from "@/components/Countdown";
import { GiantMeter } from "@/components/GiantMeter";
import { TrustChips } from "@/components/TrustChips";
import { Panel } from "@/components/Panel";
import { ButtonGhost } from "@/components/ButtonGhost";
import { useAuth } from "@/contexts/AuthContext";

// Set to midnight local (America/Edmonton) on Aug 31, 2028. 06:00Z ≈ 00:00 MT (DST-dependent).
const TARGET_DATE = new Date("2028-08-31T06:00:00Z");
const TZ = "America/Edmonton";

const Index = () => {
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000); // refresh every minute
    return () => clearInterval(t);
  }, []);

  const daysRemaining = Math.max(0, Math.ceil((TARGET_DATE.getTime() - now.getTime()) / 86_400_000));
  const lastUpdated = now.toLocaleTimeString("en-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

  // Core signal (mock). Keep simple, visually striking.
  const dsm = 62; // 0..100 dissatisfaction
  const band = dsm >= 60 ? "red" : dsm >= 40 ? "amber" : "green";
  const bandHex = band === "red" ? "#ef4444" : band === "amber" ? "#f59e0b" : "#10b981";

  return (
    <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
      <BackgroundFX band={band} />

      <Header />
      <Banner />

      {/* Hero: Countdown + Meter */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Countdown Tile */}
          <Panel className="lg:col-span-6 p-0 overflow-hidden">
            <Countdown days={daysRemaining} target={TARGET_DATE} />
          </Panel>

          {/* Giant Meter */}
          <Panel className="lg:col-span-6 p-0">
            <GiantMeter value={dsm} bandHex={bandHex} />
            <TrustChips n={2893} lastUpdated={lastUpdated} />
          </Panel>
        </div>

        {/* Single CTA Row — minimal and clear */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Panel className="lg:col-span-12 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Verified educators can log a <span className="font-semibold text-foreground">daily signal</span> — anonymous, one per day. We publish only aggregate data and never show slices with fewer than <b className="text-foreground">20</b> participants.
              </p>
              <div className="flex items-center gap-3">
                <button className="rounded-xl bg-primary/20 hover:bg-primary/30 text-primary-foreground px-4 py-2 ring-1 ring-primary/30 transition-colors">
                  Log today's signal
                </button>
                <a href="#methodology" className="rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm ring-1 ring-border transition-colors">
                  Methodology
                </a>
                <a href="#privacy" className="rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm ring-1 ring-border transition-colors">
                  Privacy
                </a>
              </div>
            </div>
          </Panel>
        </div>

        {/* Minimal press strip (for media pickup) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Panel className="lg:col-span-12 p-6">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">Press assets:</span>
              <ButtonGhost>PNG chart</ButtonGhost>
              <ButtonGhost>SVG chart</ButtonGhost>
              <ButtonGhost>CSV (30d)</ButtonGhost>
              <ButtonGhost>Embed live meter</ButtonGhost>
            </div>
          </Panel>
        </div>
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

export default Index;

import { Link } from "react-router-dom";
import sign30NotOk from "@/assets/sign-30-not-ok.png";
import signEvidence from "@/assets/sign-evidence-not-coordination.png";
import signClassSize from "@/assets/sign-count-class-size.png";

type Item = { src: string; alt: string; href?: string; caption?: string };

const DEFAULT_ITEMS: Item[] = [
  { src: sign30NotOk, alt: "30 ≠ OK.", caption: "#ClassSize", href: "/studio/signs" },
  { src: signEvidence, alt: "Evidence, not coordination.", caption: "Press kit →", href: "/press" },
  { src: signClassSize, alt: "Count class size.", caption: "Add your voice →", href: "/voices" },
];

export function MediaStrip({
  items = DEFAULT_ITEMS,
  tone = "amber",
  speedSec = 28,
}: {
  items?: Item[];
  tone?: "red" | "amber" | "green";
  speedSec?: number;
}) {
  const glow =
    tone === "red" ? "#ef4444" :
    tone === "green" ? "#22c55e" : "#f59e0b";

  // duplicate track for seamless marquee
  const track = [...items, ...items];

  return (
    <section
      aria-label="Media strip"
      className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 mb-8"
    >
      <div
        className="group relative overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md"
        style={{ boxShadow: "0 10px 40px -12px rgba(0,0,0,.55)" }}
      >
        {/* top rule + label */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
          <span className="text-[11px] uppercase tracking-[.2em] text-muted-foreground">From the Community</span>
          <Link to="/press" className="text-[12px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">
            Media kit
          </Link>
        </div>

        {/* marquee track */}
        <div className="relative py-6">
          <ul
            className="marquee flex gap-4 sm:gap-6 will-change-transform motion-reduce:animate-none px-4 sm:px-6"
            style={{
              ["--duration" as any]: `${speedSec}s`,
            }}
            aria-live="off"
          >
            {track.map((it, i) => (
              <li key={i} className="shrink-0">
                <Card item={it} glow={glow} />
              </li>
            ))}
          </ul>

          {/* gradient edges for depth */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>

      {/* local styles */}
      <style>{`
        .marquee {
          animation: marquee var(--duration) linear infinite;
        }
        .group:hover .marquee, .group:focus-within .marquee { 
          animation-play-state: paused; 
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee { 
            animation: none !important; 
            transform: translateX(0); 
          }
        }
      `}</style>
    </section>
  );
}

function Card({ item, glow }: { item: Item; glow: string }) {
  const content = (
    <figure
      className="relative w-[260px] sm:w-[320px] md:w-[360px] aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-white/10 bg-black/40 transition-transform duration-300 hover:scale-105"
      style={{ boxShadow: `0 0 0 2px ${glow}33, 0 0 24px ${glow}55` }}
    >
      <img
        src={item.src}
        alt={item.alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {item.caption && (
        <figcaption className="absolute bottom-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/50 ring-1 ring-white/10 text-slate-100">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );

  if (item.href) {
    return (
      <Link
        to={item.href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}

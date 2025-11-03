import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="relative z-10">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Digital Strike</div>
            <div className="text-[11px] text-muted-foreground/70">Lawful, privacy‑preserving educator sentiment</div>
          </div>
        </div>
        <button className="rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm ring-1 ring-border transition-colors">
          Verify educator
        </button>
      </div>
    </header>
  );
}

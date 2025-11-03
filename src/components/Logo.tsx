export function Logo() {
  return (
    <div className="relative size-10 grid place-items-center rounded-xl bg-white/10 ring-1 ring-white/20 overflow-hidden">
      <div className="absolute inset-[-20%] bg-gradient-to-r from-primary via-accent to-[hsl(var(--glow-fuchsia))] animate-spin-slow" />
      <div className="relative z-10 font-semibold text-sm bg-background/80 size-full grid place-items-center">
        DS
      </div>
    </div>
  );
}

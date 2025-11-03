export function BackgroundFX() {
  return (
    <>
      {/* radial glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_70%_-10%,hsl(var(--glow-sky)/0.12),transparent_60%),radial-gradient(900px_500px_at_10%_10%,hsl(var(--glow-emerald)/0.12),transparent_60%)]" />
      
      {/* subtle stars */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-30 mix-blend-screen" aria-hidden>
        <defs>
          <radialGradient id="g" r="1">
            <stop offset="0" stopColor="#fff"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {Array.from({ length: 120 }).map((_, i) => (
          <circle 
            key={i} 
            cx={Math.random()*1600} 
            cy={Math.random()*900} 
            r={Math.random()*1.2+0.2} 
            fill="url(#g)" 
          />
        ))}
      </svg>
      
      {/* scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px)] bg-[length:100%_32px] opacity-20" />
    </>
  );
}

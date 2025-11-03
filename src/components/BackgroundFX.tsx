interface BackgroundFXProps {
  band?: "red" | "amber" | "green";
}

export function BackgroundFX({ band = "green" }: BackgroundFXProps) {
  const tint = 
    band === "red" ? "rgba(239,68,68,.12)" :
    band === "amber" ? "rgba(245,158,11,.10)" :
    "rgba(34,197,94,.10)";

  return (
    <>
      {/* Radial glows that shift based on band */}
      <div 
        className="pointer-events-none absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(1200px 600px at 70% -10%, ${tint}, transparent 60%), radial-gradient(900px 500px at 10% 10%, rgba(126,200,255,.10), transparent 60%)`
        }}
      />
      
      {/* Subtle stars */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-25 mix-blend-screen" aria-hidden>
        <defs>
          <radialGradient id="g" r="1">
            <stop offset="0" stopColor="#fff"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {Array.from({ length: 90 }).map((_, i) => (
          <circle 
            key={i} 
            cx={Math.random() * 1600} 
            cy={Math.random() * 900} 
            r={Math.random() * 1.1 + 0.2} 
            fill="url(#g)" 
          />
        ))}
      </svg>
      
      {/* Subtle grain overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ 
          backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.7%22/></svg>')" 
        }} 
      />
      
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px)] bg-[length:100%_32px] opacity-20" />
    </>
  );
}

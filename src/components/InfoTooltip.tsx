import { ReactNode } from "react";

interface InfoTooltipProps {
  children: ReactNode;
}

export function InfoTooltip({ children }: InfoTooltipProps) {
  return (
    <span className="relative group inline-flex items-center">
      <svg 
        aria-hidden 
        className="ml-1 size-4 text-muted-foreground/70 group-hover:text-foreground transition-colors" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <span 
        role="tooltip" 
        className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-6 z-20 w-72 rounded-lg bg-card px-3 py-2 text-[12px] text-foreground ring-1 ring-border shadow-xl"
      >
        {children}
      </span>
    </span>
  );
}

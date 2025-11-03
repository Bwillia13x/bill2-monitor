import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  className?: string;
  children: ReactNode;
}

export function Panel({ className = "", children }: PanelProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-border shadow-[0_10px_40px_-12px_rgba(0,0,0,.55)]",
      className
    )}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5" />
      {children}
    </div>
  );
}

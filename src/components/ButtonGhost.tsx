import { ReactNode } from "react";

interface ButtonGhostProps {
  children: ReactNode;
}

export function ButtonGhost({ children }: ButtonGhostProps) {
  return (
    <button className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 ring-1 ring-border text-sm transition-colors">
      {children}
    </button>
  );
}

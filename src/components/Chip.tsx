import { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
}

export function Chip({ children }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 ring-1 ring-border">
      <i className="inline-block size-1.5 rounded-full bg-primary/70" />
      {children}
    </span>
  );
}

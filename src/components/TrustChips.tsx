import { Chip } from "./Chip";

interface TrustChipsProps {
  n: number;
  lastUpdated: string;
}

export function TrustChips({ n, lastUpdated }: TrustChipsProps) {
  return (
    <div className="px-6 pb-5">
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <Chip>Province‑wide n ≥ {n.toLocaleString()}</Chip>
        <Chip>All slices obey n ≥ 20</Chip>
        <Chip>Last updated {lastUpdated} MT</Chip>
      </div>
    </div>
  );
}

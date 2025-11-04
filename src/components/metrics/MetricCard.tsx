import { ReactNode } from "react";
import { Panel } from "@/components/Panel";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetricCardProps {
  title: string;
  subtitle?: string;
  tooltip?: string;
  children: ReactNode;
  threshold?: number;
  lastUpdated?: string;
  onExportPNG?: () => void;
  onExportCSV?: () => void;
}

export function MetricCard({
  title,
  subtitle,
  tooltip,
  children,
  threshold = 20,
  lastUpdated,
  onExportPNG,
  onExportCSV,
}: MetricCardProps) {
  return (
    <Panel className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {tooltip && <InfoTooltip>{tooltip}</InfoTooltip>}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {(onExportPNG || onExportCSV) && (
          <div className="flex gap-2">
            {onExportPNG && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportPNG}
                className="h-8 px-2"
                aria-label="Export as PNG"
              >
                <Download className="h-4 w-4" />
                <span className="ml-1 text-xs">PNG</span>
              </Button>
            )}
            {onExportCSV && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExportCSV}
                className="h-8 px-2"
                aria-label="Export as CSV"
              >
                <Download className="h-4 w-4" />
                <span className="ml-1 text-xs">CSV</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1">{children}</div>

      <div className="text-xs text-muted-foreground flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        <span>n≥{threshold} gating active</span>
        {lastUpdated && <span>Updated {lastUpdated}</span>}
      </div>
    </Panel>
  );
}

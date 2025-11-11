import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapTooltipProps {
    date: string;
    count: number | null;
    children: React.ReactNode;
}

export function HeatmapTooltip({ date, count, children }: HeatmapTooltipProps) {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getContent = () => {
        if (count === null) {
            return (
                <div className="text-sm">
                    <p className="font-semibold">{formatDate(date)}</p>
                    <p className="text-muted-foreground mt-1">
                        Week suppressed (n&lt;20)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Privacy threshold not met
                    </p>
                </div>
            );
        }

        return (
            <div className="text-sm">
                <p className="font-semibold">{formatDate(date)}</p>
                <p className="text-emerald-400 mt-1">
                    {count} {count === 1 ? "story" : "stories"}
                </p>
            </div>
        );
    };

    const ariaLabel = count === null
        ? `${formatDate(date)}: Week suppressed for privacy (n<20)`
        : `${formatDate(date)}: ${count} ${count === 1 ? "story" : "stories"}`;

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild aria-label={ariaLabel}>
                    {children}
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    {getContent()}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

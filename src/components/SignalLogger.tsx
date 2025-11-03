import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Panel } from "@/components/Panel";
import { useTodaySignal, useSubmitSignal } from "@/hooks/useSignals";
import { CheckCircle2 } from "lucide-react";

export function SignalLogger() {
  const [value, setValue] = useState([50]);
  const { data: todaySignal, isLoading } = useTodaySignal();
  const submitSignal = useSubmitSignal();

  const handleSubmit = () => {
    submitSignal.mutate(value[0]);
  };

  if (isLoading) {
    return (
      <Panel className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-8 bg-white/10 rounded" />
        </div>
      </Panel>
    );
  }

  if (todaySignal) {
    return (
      <Panel className="p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="size-6 text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Signal submitted for today
            </h3>
            <p className="text-sm text-muted-foreground">
              Your dissatisfaction level: <span className="font-semibold text-foreground">{todaySignal.dissatisfaction_level}</span>/100
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              You can submit one signal per day. Come back tomorrow to log again.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  const getBandColor = (val: number) => {
    if (val >= 60) return "#ef4444";
    if (val >= 40) return "#f59e0b";
    return "#10b981";
  };

  const getLabel = (val: number) => {
    if (val >= 80) return "Extremely dissatisfied";
    if (val >= 60) return "Very dissatisfied";
    if (val >= 40) return "Moderately dissatisfied";
    if (val >= 20) return "Slightly dissatisfied";
    return "Minimally dissatisfied";
  };

  return (
    <Panel className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Log today's signal
          </h3>
          <p className="text-sm text-muted-foreground">
            How dissatisfied are you with current working conditions?
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div 
                className="text-5xl font-bold leading-none"
                style={{ color: getBandColor(value[0]) }}
              >
                {value[0]}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {getLabel(value[0])}
              </div>
            </div>
            <div className="text-xs text-muted-foreground/70 text-right">
              <div>0 = No dissatisfaction</div>
              <div>100 = Maximum dissatisfaction</div>
            </div>
          </div>

          <Slider
            value={value}
            onValueChange={setValue}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />

          <Button
            onClick={handleSubmit}
            disabled={submitSignal.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {submitSignal.isPending ? "Submitting..." : "Submit Signal"}
          </Button>

          <p className="text-xs text-muted-foreground/70">
            Your signal is <strong>anonymous</strong> and will only be published as part of aggregate data when n≥20 participants.
          </p>
        </div>
      </div>
    </Panel>
  );
}

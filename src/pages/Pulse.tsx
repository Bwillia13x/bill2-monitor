import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { useTodayPoll, useMyPollResponse, useSubmitPollResponse, usePollAggregate } from "@/hooks/useMicroPoll";
import { meetsThreshold, getGatingMessage } from "@/lib/gating";
import { CheckCircle2 } from "lucide-react";

const RESPONSES = [
  { value: 1, label: "Strongly Disagree", color: "bg-red-500" },
  { value: 2, label: "Disagree", color: "bg-orange-500" },
  { value: 3, label: "Neutral", color: "bg-yellow-500" },
  { value: 4, label: "Agree", color: "bg-lime-500" },
  { value: 5, label: "Strongly Agree", color: "bg-green-500" },
];

const Pulse = () => {
  const { data: poll } = useTodayPoll();
  const { data: myResponse } = useMyPollResponse(poll?.id);
  const { data: aggregate } = usePollAggregate(poll?.id);
  const submitResponse = useSubmitPollResponse();

  const handleResponse = (value: number) => {
    if (!poll) return;
    submitResponse.mutate({ pollId: poll.id, response: value });
  };

  const hasEnoughData = aggregate && meetsThreshold(aggregate.totalResponses);

  return (
    <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden">
      <BackgroundFX />
      <Header />
      <Banner />

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Daily Pulse</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            One simple question per day. Your answer is aggregated anonymously with all other educators. Individual responses are never shown.
          </p>
        </div>

        {poll ? (
          <div className="space-y-6">
            {/* Poll question */}
            <Panel className="p-8">
              <h2 className="text-2xl font-semibold text-center mb-8">
                {poll.question}
              </h2>

              {myResponse ? (
                <div className="flex items-center justify-center gap-4 py-4">
                  <CheckCircle2 className="size-6 text-primary" />
                  <div>
                    <div className="font-semibold">Response recorded</div>
                    <div className="text-sm text-muted-foreground">
                      You selected: {RESPONSES.find(r => r.value === myResponse.response)?.label}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {RESPONSES.map((response) => (
                    <Button
                      key={response.value}
                      onClick={() => handleResponse(response.value)}
                      disabled={submitResponse.isPending}
                      variant="outline"
                      className="w-full h-14 text-lg justify-start gap-4 hover:scale-[1.02] transition-transform"
                    >
                      <div className={`size-4 rounded-full ${response.color}`} />
                      {response.label}
                    </Button>
                  ))}
                </div>
              )}
            </Panel>

            {/* Aggregate results */}
            {hasEnoughData ? (
              <Panel className="p-6">
                <h3 className="font-semibold mb-4">Aggregate Results (n≥20)</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">
                      {aggregate.avgResponse.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Average response</div>
                      <div>{aggregate.totalResponses} educator{aggregate.totalResponses !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Visual scale */}
                  <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                    {RESPONSES.map((r) => (
                      <div
                        key={r.value}
                        className={`flex-1 ${r.color} ${
                          Math.round(aggregate.avgResponse) === r.value
                            ? "ring-2 ring-white ring-inset"
                            : "opacity-40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel className="p-6 text-center">
                <div className="text-4xl mb-3">🔒</div>
                <div className="text-sm text-muted-foreground">
                  {getGatingMessage(aggregate?.totalResponses ?? 0)}
                </div>
              </Panel>
            )}
          </div>
        ) : (
          <Panel className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No poll active today</h3>
            <p className="text-muted-foreground">
              Check back tomorrow for the next daily pulse question.
            </p>
          </Panel>
        )}
      </main>

      <footer className="relative z-10 border-t border-border mt-16">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Digital Strike.</span>
          <span>Evidence, not coordination. Privacy‑by‑design.</span>
        </div>
      </footer>
    </div>
  );
};

export default Pulse;

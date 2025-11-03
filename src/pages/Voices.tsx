import { useState } from "react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { VoiceCard } from "@/components/voices/VoiceCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/Panel";
import { useOneLiners, useOneLinerCount, useSubmitOneLiner } from "@/hooks/useVoices";
import { meetsThreshold, getGatingMessage, PRIVACY_THRESHOLD } from "@/lib/gating";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";

const TONE_TAGS = ["workload", "discipline", "pay", "respect", "resources", "support"];

const Voices = () => {
  const { user } = useAuth();
  const { data: count = 0 } = useOneLinerCount();
  const { data: oneLiners = [] } = useOneLiners();
  const submitOneLiner = useSubmitOneLiner();
  
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const hasEnoughData = meetsThreshold(count);
  const charCount = text.length;
  const maxChars = 120;

  const handleSubmit = () => {
    if (charCount > maxChars || charCount === 0) return;
    
    submitOneLiner.mutate(
      { text, tags: selectedTags },
      {
        onSuccess: () => {
          setText("");
          setSelectedTags([]);
          setShowForm(false);
        },
      }
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="relative min-h-screen w-full text-foreground bg-background overflow-x-hidden pb-20">
      <BackgroundFX />
      <Header />
      <Banner />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Voices Wall</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Thousands of educators are telling us how it feels in classrooms today. We publish only anonymized quotes when at least {PRIVACY_THRESHOLD} educators have spoken in a category. <strong>Evidence, not coordination.</strong>
          </p>
        </div>

        {/* Privacy threshold status */}
        <div className="mb-8">
          <Panel className="p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {getGatingMessage(count)}
                </div>
                {hasEnoughData && (
                  <div className="text-xs text-primary">
                    ✓ Privacy threshold met - showing {oneLiners.length} voices
                  </div>
                )}
              </div>
              
              {user && (
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  Add your voice
                </Button>
              )}
            </div>
          </Panel>
        </div>

        {/* Submission form */}
        {showForm && user && (
          <div className="mb-8">
            <Panel className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Your voice (max 120 characters)
                  </label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share how you're feeling about current working conditions..."
                    className="min-h-[100px] bg-white/5 border-border"
                    maxLength={maxChars}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs ${charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {charCount}/{maxChars}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tags (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TONE_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`cursor-pointer transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10 text-foreground hover:bg-white/20"
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={charCount === 0 || charCount > maxChars || submitOneLiner.isPending}
                    className="flex-1"
                  >
                    {submitOneLiner.isPending ? "Submitting..." : "Submit for review"}
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  All submissions are reviewed before publishing. Your identity remains anonymous.
                </p>
              </div>
            </Panel>
          </div>
        )}

        {/* Voices grid */}
        {hasEnoughData && oneLiners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oneLiners.map((voice, idx) => (
              <VoiceCard
                key={voice.id}
                text={voice.text}
                tags={voice.tags}
                createdAt={voice.created_at}
                delay={idx * 0.05}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Waiting for voices</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {count === 0
                ? `Be the first to share. We need at least ${PRIVACY_THRESHOLD} voices to display content while protecting privacy.`
                : `${count} voice${count !== 1 ? 's' : ''} submitted. ${PRIVACY_THRESHOLD - count} more needed to meet the privacy threshold.`}
            </p>
          </div>
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

export default Voices;

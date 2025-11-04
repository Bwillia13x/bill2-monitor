import { useState, useEffect } from "react";
import { Panel } from "@/components/Panel";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Story {
  id: string;
  text: string;
  role?: string;
  yearsOfService?: string;
  district?: string;
}

// Mock stories - in production these would come from the database
const STORIES: Story[] = [
  {
    id: "1",
    text: "The notwithstanding clause undermines the very rights I teach my students about. How can I explain democracy when their government suspends our Charter rights?",
    role: "High School Social Studies Teacher",
    yearsOfService: "15 years",
    district: "Edmonton"
  },
  {
    id: "2",
    text: "I've dedicated my career to public education. Using the notwithstanding clause to override our collective bargaining rights feels like a betrayal of everything we've worked for.",
    role: "Elementary Teacher",
    yearsOfService: "22 years",
    district: "Calgary"
  },
  {
    id: "3",
    text: "My students deserve educators who are valued and respected. When the government uses the notwithstanding clause, it sends a message that teachers don't matter.",
    role: "Middle School Teacher",
    yearsOfService: "8 years",
    district: "Red Deer"
  },
  {
    id: "4",
    text: "I came to Alberta to teach because I believed in the system. The use of the notwithstanding clause has shaken my faith in whether this province truly values education.",
    role: "Special Education Teacher",
    yearsOfService: "5 years",
    district: "Lethbridge"
  },
  {
    id: "5",
    text: "Every day I teach my students about fairness, justice, and standing up for what's right. The notwithstanding clause contradicts everything I'm trying to instill in them.",
    role: "Primary Teacher",
    yearsOfService: "12 years",
    district: "Grande Prairie"
  }
];

export function StoryCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % STORIES.length);
    }, 8000); // Change story every 8 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % STORIES.length);
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length);
  };

  const currentStory = STORIES[currentIndex];

  return (
    <Panel className="p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Quote className="size-6 text-primary" />
            <h2 className="text-2xl font-bold">Voices from the Classroom</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} of {STORIES.length}
          </div>
        </div>

        {/* Story Content */}
        <div className="min-h-[200px] flex flex-col justify-center">
          <blockquote className="text-lg leading-relaxed mb-6 text-foreground/90 italic">
            "{currentStory.text}"
          </blockquote>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {currentStory.role && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{currentStory.role}</span>
              </div>
            )}
            {currentStory.yearsOfService && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{currentStory.yearsOfService} of service</span>
              </div>
            )}
            {currentStory.district && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{currentStory.district} area</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="rounded-full"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex gap-2">
            {STORIES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to story ${index + 1}`}
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            {isAutoPlaying ? "Auto-playing" : "Paused"}
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            All stories are anonymized to protect educator privacy. Identifying details have been generalized.
          </p>
        </div>
      </div>
    </Panel>
  );
}

import { Panel } from "@/components/Panel";
import { Heart, BookOpen, Scale, Users } from "lucide-react";

interface ImpactPoint {
  icon: React.ReactNode;
  title: string;
  description: string;
  stat?: string;
}

const IMPACT_POINTS: ImpactPoint[] = [
  {
    icon: <Scale className="size-6" />,
    title: "Charter Rights at Stake",
    description: "The notwithstanding clause allows the government to override fundamental Charter rights that protect all Albertans, including educators' right to fair collective bargaining.",
    stat: "Section 33"
  },
  {
    icon: <BookOpen className="size-6" />,
    title: "Classroom Impact",
    description: "When teachers' rights are diminished, it affects their ability to advocate for students, maintain quality education standards, and create positive learning environments.",
    stat: "Every Student"
  },
  {
    icon: <Heart className="size-6" />,
    title: "Educator Well-being",
    description: "Teachers dedicate their lives to shaping young minds. Suspending their Charter rights creates stress, uncertainty, and undermines the profession's dignity.",
    stat: "40,000+ Teachers"
  },
  {
    icon: <Users className="size-6" />,
    title: "Democratic Precedent",
    description: "Using the notwithstanding clause sets a dangerous precedent. If it can be used against educators today, whose rights will be next?",
    stat: "All Albertans"
  }
];

export function ImpactNarrative() {
  return (
    <div className="space-y-6">
      {/* Hero narrative */}
      <Panel className="p-8 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Why This Matters to Every Albertan
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            This isn't just about teachers—it's about the fundamental rights that protect all of us. 
            When the government uses the notwithstanding clause to override Charter rights, it affects 
            students, families, and the future of education in Alberta.
          </p>
        </div>
      </Panel>

      {/* Impact grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {IMPACT_POINTS.map((point, index) => (
          <Panel key={index} className="p-6 hover:ring-2 hover:ring-primary/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {point.icon}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{point.title}</h3>
                  {point.stat && (
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                      {point.stat}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Personal connection */}
      <Panel className="p-8 bg-gradient-to-br from-amber-500/5 via-background to-background">
        <div className="max-w-3xl mx-auto space-y-4">
          <h3 className="text-xl font-semibold text-center">The Human Cost</h3>
          <p className="text-muted-foreground leading-relaxed text-center">
            Behind every statistic is a dedicated educator who chose this profession to make a difference. 
            They're your child's teacher, your neighbor, your friend. They deserve to have their voices 
            heard and their rights protected. By standing together, we can demonstrate the collective 
            concern of Alberta's education community and demand respect for Charter rights.
          </p>
          <div className="flex items-center justify-center gap-8 pt-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">22</div>
              <div className="text-muted-foreground">Avg. years teaching</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">Students per teacher</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-muted-foreground">Dedicated to students</div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

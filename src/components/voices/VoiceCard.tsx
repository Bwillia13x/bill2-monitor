import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface VoiceCardProps {
  text: string;
  tags?: string[];
  createdAt: string;
  delay?: number;
}

export function VoiceCard({ text, tags = [], createdAt, delay = 0 }: VoiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative p-6 rounded-xl bg-white/5 backdrop-blur-md ring-1 ring-border hover:ring-primary/50 transition-all duration-300 group"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 rounded-xl" />
      
      <div className="relative">
        <p className="text-foreground leading-relaxed mb-4 text-sm">
          "{text}"
        </p>
        
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary-foreground border-primary/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

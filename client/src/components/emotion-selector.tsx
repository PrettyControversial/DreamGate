import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Frown, 
  Smile, 
  Meh, 
  Zap, 
  Cloud, 
  AlertCircle, 
  Star,
  Eye,
  Flame,
  Snowflake,
  Sparkles
} from "lucide-react";

const emotions = [
  { id: "joy", label: "Joy", icon: Smile, color: "text-primary" },
  { id: "fear", label: "Fear", icon: AlertCircle, color: "text-secondary" },
  { id: "sadness", label: "Sadness", icon: Frown, color: "text-muted-foreground" },
  { id: "love", label: "Love", icon: Heart, color: "text-primary" },
  { id: "anger", label: "Anger", icon: Flame, color: "text-primary" },
  { id: "confusion", label: "Confusion", icon: Cloud, color: "text-muted-foreground" },
  { id: "excitement", label: "Excitement", icon: Zap, color: "text-primary" },
  { id: "peace", label: "Peace", icon: Snowflake, color: "text-secondary" },
  { id: "curiosity", label: "Curiosity", icon: Eye, color: "text-secondary" },
  { id: "wonder", label: "Wonder", icon: Star, color: "text-secondary" },
  { id: "neutral", label: "Neutral", icon: Meh, color: "text-muted-foreground" },
  { id: "magical", label: "Magical", icon: Sparkles, color: "text-secondary" },
];

interface EmotionSelectorProps {
  selected: string[];
  onChange: (emotions: string[]) => void;
  className?: string;
}

export function EmotionSelector({ selected, onChange, className }: EmotionSelectorProps) {
  const toggleEmotion = (emotionId: string) => {
    if (selected.includes(emotionId)) {
      onChange(selected.filter(e => e !== emotionId));
    } else {
      onChange([...selected, emotionId]);
    }
  };

  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {emotions.map((emotion) => {
        const Icon = emotion.icon;
        const isSelected = selected.includes(emotion.id);
        
        return (
          <Button
            key={emotion.id}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => toggleEmotion(emotion.id)}
            className={cn(
              "flex flex-col gap-1 h-auto py-2 px-2",
              isSelected && "bg-primary"
            )}
            data-testid={`button-emotion-${emotion.id}`}
          >
            <Icon className={cn("h-4 w-4", !isSelected && emotion.color)} />
            <span className="text-xs">{emotion.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

export { emotions };

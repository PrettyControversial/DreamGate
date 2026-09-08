import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import { Link } from "wouter";

interface PromptCardProps {
  prompt: string;
  showStartButton?: boolean;
}

export function PromptCard({ prompt, showStartButton = true }: PromptCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-border" data-testid="card-writing-prompt">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <PenLine className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <blockquote className="font-display text-lg md:text-xl font-medium leading-relaxed max-w-md text-foreground" data-testid="text-prompt">
            "{prompt}"
          </blockquote>

          <div className="mt-2 flex w-full justify-center">
            {showStartButton && (
              <Link href="/decoder">
                <Button size="sm" className="w-full max-w-xs" data-testid="button-start-writing">
                  <PenLine className="h-4 w-4 mr-1.5" />
                  Start Writing
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

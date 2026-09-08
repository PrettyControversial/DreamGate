import { ArrowRight, LockKeyhole, Network, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/lib/subscription";

export default function Psyche() {
  const { isPremium, openPaywall } = useSubscription();

  return (
    <div className="min-h-screen bg-background px-5 pb-28 pt-10 md:px-8 md:pt-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Your Psyche
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          A pattern is beginning to emerge.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          A single dream can speak in symbols. Over time, your dreams can reveal
          recurring tensions, archetypes, and movements within your inner world.
        </p>

        <Card className="mt-10 overflow-hidden border-primary/25 bg-card">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[0.85fr_1.15fr]">
              <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-[#17121c] via-[#292033] to-[#0c0a0e] p-10 text-[#eee4f5]">
                <div className="relative">
                  <div className="absolute inset-0 scale-150 rounded-full bg-[#b99aca]/15 blur-3xl" />
                  <Network className="relative h-24 w-24 stroke-[1]" />
                  <Sparkles className="absolute -right-5 -top-5 h-6 w-6" />
                </div>
              </div>
              <div className="flex flex-col justify-center p-7 md:p-10">
                {isPremium ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.22em] text-primary">
                      Psyra+ unlocked
                    </p>
                    <h2 className="mt-3 font-display text-3xl">
                      Your inner map is ready to grow.
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      As you record and interpret more dreams, Psyra will surface
                      meaningful recurring patterns here. No insight is shown
                      until your journal contains enough genuine dream material.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30">
                      <LockKeyhole className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="mt-5 font-display text-3xl">
                      See the story across your dreams.
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      Psyra+ connects recurring symbols, archetypes, and emotional
                      themes without inventing conclusions your journal has not
                      earned.
                    </p>
                    <Button
                      size="lg"
                      className="mt-7 w-full sm:w-fit"
                      onClick={() =>
                        openPaywall({
                          feature: "yourPsyche",
                          eyebrow: "Your Psyche",
                          title: "Unlock Your Psyche",
                          description:
                            "Follow the symbols, archetypes, and emotional patterns that emerge across your dream journal.",
                        })
                      }
                      data-testid="button-unlock-psyche"
                    >
                      Unlock Your Psyche
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
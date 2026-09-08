import { Link } from "wouter";
import { ArrowLeft, CircleHelp, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "How do I record a dream with my voice?",
    answer:
      "Open Dream Decode and choose Speak instead below a dream field. Allow microphone access, then speak naturally. Your words will appear as text that you can edit before saving.",
  },
  {
    question: "Where are my dreams saved?",
    answer:
      "Your dreams are private to your account. Find them anytime in Library, or open the Dream Decode page to revisit an interpretation.",
  },
  {
    question: "How does Psyra interpret dreams?",
    answer:
      "Psyra offers reflective, Jung-inspired prompts about images, emotions, and themes. It is a tool for self-reflection, not a diagnosis or a prediction.",
  },
  {
    question: "Can I use DreamGate on my phone?",
    answer:
      "Yes. DreamGate is designed for mobile screens, and voice input works when your browser or installed app provides microphone access.",
  },
];

export default function HelpFaq() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/user-portal">
            <Button variant="ghost" size="icon" aria-label="Back to home" data-testid="button-help-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">DreamGate support</p>
            <h1 className="font-display text-3xl text-foreground">Help & FAQ</h1>
          </div>
        </div>

        <Card className="border-primary/20 bg-card">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CircleHelp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-foreground">A little guidance for your practice</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  DreamGate is a quiet space to remember, reflect, and explore.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border border-y border-border">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="cursor-pointer list-none pr-6 font-medium text-foreground marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {faq.question}
                      <span className="text-xl font-light text-muted-foreground transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          <Link href="/user-portal">
            <Button variant="outline" className="gap-2 rounded-full">
              <Home className="h-4 w-4" />
              Back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
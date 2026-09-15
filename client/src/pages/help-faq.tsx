import { Link } from "wouter";
import { ArrowLeft, CircleHelp, Home, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    question: "Can I use Psyra on my phone?",
    answer:
      "Yes. Psyra is designed for mobile screens, and voice input works when your browser or installed app provides microphone access.",
  },
];

export default function HelpFaq({
  onDeleteAccount,
  isDeletingAccount,
}: {
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
}) {
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
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Psyra support</p>
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
                  Psyra is a quiet space to remember, reflect, and explore.
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

        <Card className="border-red-200/70 bg-card">
          <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="font-display text-xl text-foreground">Manage your account</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Permanently remove your account and all saved Psyra data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-red-700 underline decoration-red-700/40 underline-offset-4 transition-colors hover:text-red-800 md:self-auto"
                  data-testid="button-delete-account"
                  disabled={isDeletingAccount}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-[#171513]/20 bg-[#f6f3ec] text-[#171513]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-2xl font-normal">
                    Delete your account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#77716a]">
                    This permanently deletes your Psyra account and all saved
                    dreams, interpretations, and private journal data. This cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeletingAccount}
                    className="border-[#171513]/20 bg-transparent text-[#171513] hover:bg-[#171513]/5"
                  >
                    Keep my account
                  </AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={(event) => {
                      event.preventDefault();
                      onDeleteAccount();
                    }}
                    className="bg-red-700 text-white hover:bg-red-800 focus:ring-red-700"
                  >
                    {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeletingAccount ? "Deleting…" : "Delete permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
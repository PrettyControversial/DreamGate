import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground md:px-8">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <Link href="/" className="inline-block">
            <Button variant="ghost" className="px-0" data-testid="button-privacy-back">
              Back to Psyra
            </Button>
          </Link>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Psyra
          </p>
          <h1 className="font-display text-4xl">Privacy Policy</h1>
        </header>

        <section className="space-y-3">
          <h2 className="font-display text-2xl">Dreams and AI</h2>
          <p className="leading-relaxed text-muted-foreground">
            When you request a dream interpretation after agreeing to the
            disclosure, Psyra sends the dream text you provide to the OpenAI API
            to create that interpretation. Dream text is used only to create
            your interpretation and is not used to train AI models.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Psyra uses OpenAI for its AI features. No other AI provider is used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl">Your saved reflections</h2>
          <p className="leading-relaxed text-muted-foreground">
            Your dreams and interpretations are saved to your Psyra account so
            you can return to them. You can delete individual dreams from your
            journal or permanently delete your account and its saved Psyra data
            from Help &amp; FAQ.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl">Your choice</h2>
          <p className="leading-relaxed text-muted-foreground">
            You can use Psyra without agreeing to send dream text for an AI
            interpretation. If you do not agree, Psyra will not send that
            dream to the AI provider.
          </p>
        </section>
      </article>
    </main>
  );
}

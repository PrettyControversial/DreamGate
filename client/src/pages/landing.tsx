import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";
import authBackgroundVideo from "@assets/Heading_(2)_1788379592807.mp4";
import welcomeSymbol from "@assets/obj__(2)_1788380180447.png";
import { trackEvent } from "@/lib/analytics";

export default function Landing() {
  useEffect(() => {
    trackEvent("landing_viewed");
  }, []);

  return (
    <div className="glam-page glam-welcome-page relative min-h-[100dvh] overflow-hidden text-foreground">
      <video
        className="glam-welcome-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={authBackgroundVideo} type="video/mp4" />
      </video>
      <div className="glam-welcome-overlay" aria-hidden="true" />

      <main className="glam-welcome-main relative z-10 flex min-h-[100dvh] flex-col items-center px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] text-center">
        <section className="glam-welcome-copy flex flex-1 flex-col items-center justify-center">
          <img
            src={welcomeSymbol}
            alt="Eye symbol"
            className="glam-welcome-symbol mb-7 h-auto w-28 object-contain"
          />
          <p className="glam-welcome-kicker font-accent text-base tracking-[0.16em]">
            Welcome to
          </p>
          <h1 className="glam-welcome-title mt-2 font-display text-5xl leading-none sm:text-6xl">
            DreamGate
          </h1>
          <p className="glam-welcome-description mt-6 max-w-sm text-base leading-relaxed sm:text-lg">
            A doorway into the world beneath your waking mind.
          </p>
        </section>

        <section className="glam-welcome-actions flex w-full max-w-xs flex-col gap-4" aria-label="Account access">
          <Button asChild size="lg" className="glam-welcome-button glam-welcome-button-primary">
            <Link href="/sign-in">Log in</Link>
          </Button>
          <Button asChild size="lg" className="glam-welcome-button glam-welcome-button-secondary">
            <Link
              href="/sign-up"
              onClick={() => trackEvent("signup_started", { source: "landing" })}
            >
              Create account
            </Link>
          </Button>
          <p className="glam-welcome-note mt-2 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.16em]">
            <LockKeyhole className="h-3 w-3" />
            Your reflections stay private
          </p>
        </section>
      </main>
    </div>
  );
}

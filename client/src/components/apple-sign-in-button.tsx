import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useSignIn, useSignUp } from "@clerk/react/legacy";
import { FaApple } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  appleSignInErrorMessage,
  exchangeAppleIdentityToken,
  isAppleSignInCancellation,
} from "@/lib/apple-sign-in";

export function AppleSignInButton({
  disabled = false,
  onBusyChange,
}: {
  disabled?: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nextStep, setNextStep] = useState<"sign-in" | null>(null);
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<"email_code" | "phone_code" | "totp" | "backup_code" | null>(null);
  const [verificationHint, setVerificationHint] = useState("");
  const inFlight = useRef(false);

  // The native system sheet needs no browser redirect or web Services ID.
  // Leave the existing web and Android sign-in experiences unchanged.
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return null;

  const signInWithApple = async () => {
    if (disabled || inFlight.current || !signInLoaded || !signUpLoaded) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const { response } = await SignInWithApple.authorize({
        // These two web-only fields are required by the plugin's shared types;
        // its iOS implementation uses the signed app's bundle ID, not these values.
        clientId: "",
        redirectURI: "",
        scopes: "email name",
        nonce: crypto.randomUUID(),
      });
      const result = await exchangeAppleIdentityToken({ signIn, signUp }, response);
      if (result.sessionId) {
        await setActive({ session: result.sessionId });
        // The containing auth page already navigates when its session activates.
      } else {
        // Preserve Clerk's MFA, client trust, and required-field checks.
        if (result.nextStep === "sign-up") {
          throw new Error(
            `Apple verified your identity, but account setup still requires: ${
              signUp.missingFields.join(", ").replaceAll("_", " ") || "additional verification"
            }. Please complete account setup before signing in.`,
          );
        }
        const factors = signIn.supportedSecondFactors ?? [];
        const selected = factors.find((item) => item.strategy === "totp") ??
          factors.find((item) => item.strategy === "email_code") ??
          factors.find((item) => item.strategy === "phone_code") ??
          factors.find((item) => item.strategy === "backup_code");
        if (!selected) {
          throw new Error("Your account requires additional verification that is not available here. Please use your existing sign-in method.");
        }
        if (selected.strategy === "phone_code") {
          await signIn.prepareSecondFactor({ strategy: "phone_code", phoneNumberId: selected.phoneNumberId });
        } else if (selected.strategy === "email_code") {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
        }
        setFactor(selected.strategy);
        setCode("");
        setVerificationHint(
          selected.strategy === "totp" ? "Enter the code from your authenticator app." :
          selected.strategy === "backup_code" ? "Enter one of your account's backup codes." :
          "Enter the verification code sent to your account.",
        );
        setNextStep("sign-in");
      }
    } catch (caughtError) {
      if (!isAppleSignInCancellation(caughtError)) {
        setError(appleSignInErrorMessage(caughtError));
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factor || !signIn || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const result = await signIn.attemptSecondFactor({ strategy: factor, code });
      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Verification is not complete. Please check the code and try again.");
      }
      await setActive({ session: result.createdSessionId });
      setNextStep(null);
    } catch (caughtError) {
      setError(appleSignInErrorMessage(caughtError));
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  };

  return (
    <>
      <div className="mt-5">
        <button
          type="button"
          onClick={signInWithApple}
          disabled={disabled || busy || !signInLoaded || !signUpLoaded}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white bg-black px-4 py-3 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="button-sign-in-with-apple"
        >
          <FaApple className="h-5 w-5" aria-hidden="true" />
          {busy ? "Signing in…" : "Sign in with Apple"}
        </button>
        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
      </div>
      <Dialog open={nextStep !== null} onOpenChange={(open) => { if (!open) setNextStep(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-[#45414e] bg-[#050507] text-[#f8f4fa]">
          <DialogHeader>
            <DialogTitle>Finish signing in</DialogTitle>
            <DialogDescription className="text-[#aca8b4]">
              {verificationHint}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={verify} className="space-y-4">
            <label className="block text-sm">
              Verification code
              <input
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-[#45414e] bg-[#111116] px-4 py-3 text-[#f8f4fa]"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="w-full rounded-xl bg-[#d9d7e6] px-4 py-3 font-semibold text-[#171517] disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify and sign in"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

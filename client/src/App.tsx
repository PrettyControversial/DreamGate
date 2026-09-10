import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useSignIn,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  Redirect,
  Route,
  Router as WouterRouter,
  Switch,
  Link,
  useLocation,
} from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  CircleHelp,
  Eye,
  EyeOff,
  LogOut,
  Menu,
} from "lucide-react";
import { queryClient, setAuthTokenProvider } from "./lib/queryClient";
import { trackEvent } from "@/lib/analytics";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PsyraPaywall } from "@/components/psyra-paywall";
import { SubscriptionProvider, useSubscription } from "@/lib/subscription";
import { BottomNav } from "@/components/bottom-nav";
import { DreamGateLogo } from "@/components/dreamgate-logo";
import { DreamGateFunctionSymbol } from "@/components/dreamgate-function-symbol";
import { DreamGateSymbolBackground } from "@/components/dreamgate-symbol-background";
import { DreamgateIntro } from "@/components/dreamgate-intro";
import { LunarNotificationSync } from "@/components/lunar-notification-settings";
import {
  deactivateLunarNotificationUser,
  supportsLunarNotifications,
} from "@/lib/lunar-notifications";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import authBackgroundVideo from "@assets/Heading_(2)_1788379592807.mp4";
import dreamgateLogo from "@assets/dreamgate_brand/dreamgate-logo.webp";
import statsSymbol from "@assets/dreamgate_symbols/footer/139.webp";
import discoverSymbol from "@assets/dreamgate_symbols/footer/discover.webp";
import drawerSymbol from "@assets/dreamgate_symbols/background/62.webp";

const Landing = lazy(() => import("@/pages/landing"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const DreamPage = lazy(() => import("@/pages/dream"));
const DreamDetail = lazy(() => import("@/pages/dream-detail"));
const DreamDecoder = lazy(() => import("@/pages/dream-decoder"));
const WritingPrompts = lazy(() => import("@/pages/writing-prompts"));
const DreamArchive = lazy(() => import("@/pages/dream-archive"));
const DreamWrapped = lazy(() => import("@/pages/dream-wrapped"));
const MoonTracker = lazy(() => import("@/pages/moon-tracker"));
const MoonCalendar = lazy(() => import("@/pages/moon-calendar"));
const DreamDictionary = lazy(() => import("@/pages/dream-dictionary"));
const Meditation = lazy(() => import("@/pages/meditation"));
const Tarot = lazy(() => import("@/pages/tarot"));
const Stats = lazy(() => import("@/pages/stats"));
const Discover = lazy(() => import("@/pages/discover"));
const Psyche = lazy(() => import("@/pages/psyche"));
const HelpFaq = lazy(() => import("@/pages/help-faq"));

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function normalizeClerkRoute(path: string): string {
  if (Capacitor.isNativePlatform() && /^capacitor:/i.test(path)) {
    try {
      const nativeUrl = new URL(path);
      return stripBase(
        `${nativeUrl.pathname}${nativeUrl.search}${nativeUrl.hash}` || "/",
      );
    } catch {
      return "/";
    }
  }

  return stripBase(path);
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: dreamgateLogo,
  },
  variables: {
    colorPrimary: "#d9d7e6",
    colorForeground: "#f8f4fa",
    colorMutedForeground: "#aca8b4",
    colorDanger: "#ef4444",
    colorBackground: "#050507",
    colorInput: "#111116",
    colorInputForeground: "#f8f4fa",
    colorNeutral: "#5a5663",
    fontFamily: "Raleway, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
        "auth-video-card w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display text-[#f8f4fa]",
    headerSubtitle: "text-[#aca8b4]",
    socialButtonsBlockButtonText: "text-[#f8f4fa]",
    socialButtons: "hidden",
    socialButtonsBlockButton: "hidden",
    dividerRow: "hidden",
    formFieldLabel: "text-[#f8f4fa]",
    footerActionLink: "text-[#d9d7e6] hover:text-[#f1eff7]",
    footerActionText: "text-[#aca8b4]",
    dividerText: "text-[#aca8b4]",
    identityPreviewEditButton: "text-[#d9d7e6]",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-[#f8f4fa]",
    logoBox: "h-16",
    logoImage: "h-14 w-auto",
    formButtonPrimary:
      "bg-[#d9d7e6] text-[#171517] hover:bg-[#f1eff7] font-semibold disabled:cursor-not-allowed disabled:opacity-45",
    formFieldInput:
      "border-[#45414e] bg-[#111116] text-[#f8f4fa] focus:border-[#d9d7e6]",
    formFieldInputShowPasswordButton:
      "text-[#f0d48a] hover:text-white focus-visible:text-white",
    formFieldInputShowPasswordIcon: "text-[#f0d48a]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#45414e]",
    alert: "border-[#5a5663] bg-[#111116]",
    otpCodeFieldInput: "border-[#45414e] bg-[#111116] text-[#f8f4fa]",
    formFieldRow: "text-[#f8f4fa]",
    main: "gap-5",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const activeQueryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;

      if (
        previousUserId.current !== undefined &&
        previousUserId.current !== userId
      ) {
        activeQueryClient.clear();
      }

      previousUserId.current = userId;
    });

    return unsubscribe;
  }, [activeQueryClient, addListener]);

  return null;
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block text-sm">
      <span>{label}</span>
      <span className="relative mt-2 block">
        <input
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-[#45414e] bg-[#111116] px-4 py-3 pr-12 text-[#f8f4fa] outline-none focus:border-[#d9d7e6]"
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={isVisible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#f0d48a] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d48a] focus-visible:ring-inset"
        >
          {isVisible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </span>
    </label>
  );
}

function SignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isSubmitting = fetchStatus === "fetching";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const result = await signIn.password({ emailAddress, password });
      if (result.error) {
        setError(result.error.longMessage || result.error.message);
        return;
      }

      if (signIn.status !== "complete" || !signIn.createdSessionId) {
        if (signIn.status === "needs_second_factor") {
          setError(
            "This account requires an additional verification step that is not enabled on this screen.",
          );
        } else if (signIn.status === "needs_client_trust") {
          setError(
            "This device needs to be verified before you can sign in. Please try again from the sign-in page.",
          );
        } else {
          setError(
            "Your password was accepted, but Clerk did not create a session. Please try signing in again.",
          );
        }
        return;
      }

      await signIn.finalize();
    } catch (caughtError) {
      const response = caughtError as {
        longMessage?: string;
        message?: string;
        errors?: Array<{ longMessage?: string; message?: string }>;
      };
      setError(
        response.longMessage ||
          response.errors?.[0]?.longMessage ||
          response.message ||
          response.errors?.[0]?.message ||
          "We couldn't complete sign-in. Please try again.",
      );
    }
  };

  return (
    <AuthPageLayout>
      <div className="auth-video-card mx-auto w-[440px] max-w-full overflow-hidden p-8 text-[#f8f4fa]">
        <img src={dreamgateLogo} alt="DreamGate" className="mx-auto h-14 w-auto" />
        <div className="mt-6 text-center">
          <h1 className="font-display text-2xl">Welcome back to DreamGate</h1>
          <p className="mt-1 text-sm text-[#aca8b4]">Sign in to continue your dream practice</p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#45414e] bg-[#111116] px-4 py-3 text-[#f8f4fa] outline-none focus:border-[#d9d7e6]"
            />
          </label>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
          {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#d9d7e6] px-4 py-3 font-semibold text-[#171517] disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/sign-in/forgot-password" className="text-[#d9d7e6]">
            Forgot password?
          </Link>
          <Link href="/sign-up" className="text-[#d9d7e6]">
            Create account
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
}

function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const [step, setStep] = useState<"email" | "code" | "password" | "complete">(
    "email",
  );
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordCanBeUpdated =
    newPassword.length >= 15 && newPassword === confirmPassword;

  const clerkErrorMessage = (caughtError: unknown) => {
    const response = caughtError as {
      longMessage?: string;
      message?: string;
      errors?: Array<{ longMessage?: string; message?: string }>;
    };
    return (
      response.longMessage ||
      response.message ||
      response.errors?.[0]?.longMessage ||
      response.errors?.[0]?.message ||
      "We couldn't complete that request. Please try again."
    );
  };

  const sendResetCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;

    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const created = await signIn.create({
        identifier: emailAddress,
      });
      if (created.error) {
        setError(clerkErrorMessage(created.error));
        return;
      }

      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) {
        setError(clerkErrorMessage(sent.error));
      } else {
        setStep("code");
        setMessage("Check your email for a six-digit reset code.");
      }
    } catch (caughtError) {
      setError(clerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyResetCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;

    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (result.error) {
        setError(clerkErrorMessage(result.error));
      } else {
        setStep("password");
        setMessage("Code verified. Choose a new password.");
      }
    } catch (caughtError) {
      setError(clerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;

    setError("");
    setMessage("");
    if (newPassword.length < 15) {
      setError("Your password must contain 15 or more characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });
      if (result.error) {
        setError(clerkErrorMessage(result.error));
      } else {
        setStep("complete");
        setMessage("Your password has been updated. You can sign in now.");
      }
    } catch (caughtError) {
      setError(clerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="auth-video-card mx-auto w-[440px] max-w-full overflow-hidden p-8 text-[#f8f4fa]">
        <img src={dreamgateLogo} alt="DreamGate" className="mx-auto h-14 w-auto" />
        <div className="mt-6 text-center">
          <h1 className="font-display text-2xl">
            {step === "complete" ? "Password updated" : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-[#aca8b4]">
            {step === "email" && "We'll send a reset code to your email."}
            {step === "code" && "Enter the code from your email."}
            {step === "password" && "Choose a new password for DreamGate."}
            {step === "complete" && "Your private dream space is ready for you."}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={sendResetCode} className="mt-7 space-y-5">
            <label className="block text-sm">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#45414e] bg-[#111116] px-4 py-3 text-[#f8f4fa] outline-none focus:border-[#d9d7e6]"
              />
            </label>
            {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#d9d7e6] px-4 py-3 font-semibold text-[#171517] disabled:opacity-60"
            >
              {isSubmitting ? "Sending code…" : "Send reset code"}
            </button>
          </form>
        ) : step === "code" ? (
          <form onSubmit={verifyResetCode} className="mt-7 space-y-5">
            <label className="block text-sm">
              <span>Reset code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#45414e] bg-[#111116] px-4 py-3 text-center tracking-[0.35em] text-[#f8f4fa] outline-none focus:border-[#d9d7e6]"
              />
            </label>
            {message && <p className="text-sm text-emerald-300" role="status">{message}</p>}
            {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#d9d7e6] px-4 py-3 font-semibold text-[#171517] disabled:opacity-60"
            >
              {isSubmitting ? "Verifying…" : "Verify code"}
            </button>
          </form>
        ) : step === "password" ? (
          <form onSubmit={updatePassword} className="mt-7 space-y-5">
            <PasswordField
              label="New password"
              autoComplete="new-password"
              minLength={15}
              value={newPassword}
              onChange={setNewPassword}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              minLength={15}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !passwordCanBeUpdated}
              className="w-full rounded-xl bg-[#d9d7e6] px-4 py-3 font-semibold text-[#171517] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Updating password…" : "Update password"}
            </button>
          </form>
        ) : (
          <div className="mt-7">
            {message && <p className="text-center text-sm text-emerald-300" role="status">{message}</p>}
          </div>
        )}

        {message && step === "email" && (
          <p className="mt-4 text-center text-sm text-emerald-300" role="status">{message}</p>
        )}
        <div className="mt-6 text-center text-sm">
          <Link href="/sign-in" className="text-[#d9d7e6]">
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  );
}

function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const sawSignedOut = useRef(false);
  const trackedCompletion = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      sawSignedOut.current = true;
      return;
    }

    if (sawSignedOut.current && !trackedCompletion.current) {
      trackedCompletion.current = true;
      trackEvent("account_creation_completed");
    }
  }, [isLoaded, isSignedIn]);

  return (
    <AuthPageLayout>
      <div
        className="glam-signup-password-guard"
        onSubmitCapture={(event) => {
          if (!isClerkSignUpStepValid(event.currentTarget)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onClickCapture={(event) => {
          const button = (event.target as HTMLElement).closest("button");
          if (!button) return;

          const label = button.getAttribute("aria-label")?.toLowerCase() ?? "";
          const isPasswordToggle =
            label.includes("show password") || label.includes("hide password");

          if (!isPasswordToggle && !isClerkSignUpStepValid(event.currentTarget)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
        <ClerkPasswordValidationGuard />
      </div>
    </AuthPageLayout>
  );
}

function isClerkSignUpStepValid(container: Element) {
  const emailInputs = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="email"]'),
  );
  const passwordInputs = Array.from(
    new Set(
      container.querySelectorAll<HTMLInputElement>(
        'input[type="password"], input[name="password"], input[autocomplete="new-password"]',
      ),
    ),
  );

  const emailsAreValid =
    emailInputs.length === 0 ||
    emailInputs.every(
      (input) => input.value.trim().length > 0 && input.checkValidity(),
    );
  const passwordsAreValid =
    passwordInputs.length === 0 ||
    passwordInputs.every(
      (input) => input.value.length >= 15 && input.checkValidity(),
    );

  return emailsAreValid && passwordsAreValid;
}

function ClerkPasswordValidationGuard() {
  useEffect(() => {
    const updatePasswordButtonState = () => {
      document
        .querySelectorAll<HTMLElement>(".glam-signup-password-guard")
        .forEach((container) => {
        const passwordInputs = Array.from(
          container.querySelectorAll<HTMLInputElement>(
            'input[type="password"], input[name="password"], input[autocomplete="new-password"]',
          ),
        );
        const submitButton =
          container.querySelector<HTMLButtonElement>(
            'button[type="submit"], button[data-localization-key^="formButtonPrimary"], .cl-formButtonPrimary',
          ) ??
          Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
            (button) => {
              const label = button.getAttribute("aria-label")?.toLowerCase() ?? "";
              return (
                !label.includes("show password") &&
                !label.includes("hide password")
              );
            },
          );

        if (!passwordInputs.length) {
          container.dataset.stepValid = "true";
          return;
        }

        const passwordIsValid = isClerkSignUpStepValid(container);
        container.dataset.stepValid = passwordIsValid ? "true" : "false";

        if (!submitButton) return;

        if (!passwordIsValid) {
          submitButton.disabled = true;
          submitButton.dataset.dreamgatePasswordGuard = "true";
          submitButton.setAttribute("aria-disabled", "true");
        } else if (submitButton.dataset.dreamgatePasswordGuard === "true") {
          submitButton.disabled = false;
          delete submitButton.dataset.dreamgatePasswordGuard;
          submitButton.removeAttribute("aria-disabled");
        }
        });
    };

    const observer = new MutationObserver(updatePasswordButtonState);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", updatePasswordButtonState, true);
    updatePasswordButtonState();

    return () => {
      observer.disconnect();
      document.removeEventListener("input", updatePasswordButtonState, true);
    };
  }, []);

  return null;
}

function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glam-auth-shell glam-auth-video-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10">
      <video
        className="glam-auth-video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src={authBackgroundVideo} type="video/mp4" />
      </video>
      <div className="glam-auth-video-overlay" aria-hidden="true" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

function AccountControls({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useUser();
  const [location] = useLocation();
  const label =
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Dreamer";
  const isActive = (path: string) =>
    path === "/user-portal"
      ? location === path
      : location === path || location.startsWith(`${path}/`);

  const drawerLinkClass = (path: string) =>
    `dreamgate-drawer-link${isActive(path) ? " dreamgate-drawer-link--active" : ""}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-2 rounded-full px-3 text-muted-foreground hover:text-foreground"
          aria-label="Open account menu"
          data-testid="button-account-menu"
        >
          <span className="max-w-28 truncate text-xs sm:max-w-40">{label}</span>
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="dreamgate-account-drawer flex w-[82vw] max-w-[360px] flex-col overflow-hidden border-l-0 p-0"
      >
        <img
          src={drawerSymbol}
          alt=""
          aria-hidden="true"
          className="dreamgate-drawer-watermark"
          draggable={false}
        />

        <SheetHeader className="relative z-10 px-7 pb-4 pt-20 text-left">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[#6d6861]">
            {label}&apos;s space
          </p>
          <SheetTitle className="font-display text-3xl font-normal text-[#171513]">
            Move through DreamGate
          </SheetTitle>
          <SheetDescription className="max-w-[17rem] font-accent text-xs leading-relaxed text-[#77716a]">
            Return to the places that support your dream practice.
          </SheetDescription>
        </SheetHeader>

        <nav
          className="relative z-10 flex-1 overflow-y-auto px-4 py-2"
          aria-label="DreamGate menu"
        >
          <SheetClose asChild>
            <Link href="/user-portal" className={drawerLinkClass("/user-portal")}>
              <DreamGateFunctionSymbol kind="home" className="h-7 w-7" />
              <span>Home</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/decoder" className={drawerLinkClass("/decoder")}>
              <DreamGateFunctionSymbol kind="decode" className="h-7 w-7" />
              <span>Dream Decode</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/archive" className={drawerLinkClass("/archive")}>
              <DreamGateFunctionSymbol kind="archive" className="h-7 w-7" />
              <span>Library</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/night-map" className={drawerLinkClass("/night-map")}>
              <DreamGateFunctionSymbol kind="night-map" className="h-7 w-7" />
              <span>Night Map</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/discover" className={drawerLinkClass("/discover")}>
              <img
                src={discoverSymbol}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
                draggable={false}
              />
              <span>Discover</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/stats" className={drawerLinkClass("/stats")}>
              <img
                src={statsSymbol}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
                draggable={false}
              />
              <span>Stats</span>
            </Link>
          </SheetClose>

          <div className="dreamgate-drawer-divider" />

          <SheetClose asChild>
            <Link href="/help" className={drawerLinkClass("/help")}>
              <CircleHelp className="h-7 w-7 stroke-[1.3]" />
              <span>Help & FAQ</span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <button
              type="button"
              onClick={onSignOut}
              className="dreamgate-drawer-link dreamgate-drawer-link--signout w-full"
              data-testid="button-sign-out"
            >
              <LogOut className="h-7 w-7 stroke-[1.3]" />
              <span>Sign out</span>
            </button>
          </SheetClose>
        </nav>

        <div className="relative z-10 mx-7 mb-[max(1.75rem,env(safe-area-inset-bottom))] mt-4 border-t border-[#171513]/15 pt-5">
          <div className="flex items-center gap-3">
            <DreamGateLogo />
            <div>
              <p className="dreamgate-wordmark text-base text-[#171513]">DreamGate</p>
              <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[#77716a]">
                The world beneath your waking mind
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RouteLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Opening your dream space…</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/user-portal" component={Dashboard} />
        <Route path="/dream" component={DreamPage} />
        <Route path="/log">
          {() => {
            window.location.href = `${basePath}/decoder`;
            return null;
          }}
        </Route>
        <Route path="/log/:id">
          {({ id }) => {
            window.location.href = `${basePath}/decoder/${id}`;
            return null;
          }}
        </Route>
        <Route path="/dream/:id" component={DreamDetail} />
        <Route path="/decoder" component={DreamDecoder} />
        <Route path="/decoder/:id" component={DreamDecoder} />
        <Route path="/prompts" component={WritingPrompts} />
        <Route path="/archive" component={DreamArchive} />
        <Route path="/wrapped" component={DreamWrapped} />
        <Route path="/night-map" component={MoonTracker} />
        <Route path="/tracker" component={MoonTracker} />
        <Route path="/lunar-calendar" component={MoonCalendar} />
        <Route path="/calendar" component={MoonCalendar} />
        <Route path="/dictionary" component={DreamDictionary} />
        <Route path="/meditation" component={Meditation} />
        <Route path="/tarot" component={Tarot} />
        <Route path="/stats" component={Stats} />
        <Route path="/discover" component={Discover} />
        <Route path="/psyche" component={Psyche} />
        <Route path="/help" component={HelpFaq} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { paywallRequest, closePaywall } = useSubscription();
  const isDiscover = location === "/discover";

  const isDreamDecoder =
    location === "/dream" ||
    location.startsWith("/dream/") ||
    location.startsWith("/decoder");
  const isHome = location === "/user-portal";
  const handleSignOut = () => {
    try {
      sessionStorage.removeItem("dreamgate-intro-seen-v3");
    } catch {
      // Sign-out should continue even when session storage is unavailable.
    }
    setIsSigningOut(true);
  };
  const completeSignOut = () => {
    void (async () => {
      try {
        if (user?.id && supportsLunarNotifications()) {
          await deactivateLunarNotificationUser(user.id);
        }
      } finally {
        await signOut({ redirectUrl: basePath || "/" });
      }
    })();
  };

  return (
    <>
      <Show when="signed-in">
        <div
          className={`dreamgate-app-shell day-mode-shell flex min-h-[100dvh] w-full flex-col bg-background${isDiscover ? " discover-shell" : ""}${isDreamDecoder ? " dream-decoder-shell" : ""}`}
        >
          <header className={`glam-app-header relative z-20 flex items-center justify-between border-b border-border/70 bg-background px-4 py-3${isDreamDecoder ? " dream-decoder-header" : ""}${isHome ? " home-page-header" : ""}${isDiscover ? " discover-night-header" : ""}`}>
            <Link href="/user-portal" className="flex items-center gap-2.5">
                <DreamGateLogo />
                <h1 className="dreamgate-wordmark text-base text-foreground">
                  DreamGate
                </h1>
              </Link>
            <AccountControls onSignOut={handleSignOut} />
          </header>
          <LunarNotificationSync />
          <DreamGateSymbolBackground />
          <main className="relative z-10 min-h-0 flex-1">
            <AppRoutes />
          </main>
          <BottomNav />
          <PsyraPaywall
            open={paywallRequest !== null}
            request={paywallRequest}
            onClose={closePaywall}
          />
          {isSigningOut && (
            <DreamgateIntro
              onComplete={completeSignOut}
              onError={completeSignOut}
            />
          )}
        </div>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/user-portal" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/forgot-password/*?" component={ForgotPasswordPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route>
        <AuthenticatedApp />
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        formFieldLabel__emailAddress: "Email",
        formFieldLabel__password: "Password",
        formButtonPrimary: "Sign in",
        signIn: {
          start: {
            title: "Welcome back to DreamGate",
            subtitle: "Sign in to continue your dream practice",
          },
        },
        signUp: {
          start: {
            title: "Begin your DreamGate journey",
            subtitle: "Create an account to keep your reflections private",
          },
        },
      }}
      routerPush={(to) => setLocation(normalizeClerkRoute(to))}
      routerReplace={(to) =>
        setLocation(normalizeClerkRoute(to), { replace: true })
      }
    >
      <AuthenticatedQueryProvider />
    </ClerkProvider>
  );
}

function AuthenticatedQueryProvider() {
  const { getToken, isLoaded } = useAuth();
  const isNativePlatform = Capacitor.isNativePlatform();
  const [authTransportReady, setAuthTransportReady] = useState(!isNativePlatform);

  useEffect(() => {
    // Browser builds use Clerk's same-origin session cookie. Native Capacitor
    // webviews do not share that cookie jar, so only they use bearer tokens.
    setAuthTokenProvider(isNativePlatform ? getToken : null);
    setAuthTransportReady(true);
    return () => {
      setAuthTokenProvider(null);
      setAuthTransportReady(false);
    };
  }, [getToken, isNativePlatform]);

  return (
    <QueryClientProvider client={queryClient}>
      {authTransportReady && isLoaded ? (
        <>
          <ClerkQueryClientCacheInvalidator />
          <ThemeProvider defaultTheme="light" storageKey="dreamgate-clean-day-mode">
            <TooltipProvider>
              <SubscriptionProvider>
                <Suspense fallback={<RouteLoading />}>
                  <Router />
                </Suspense>
                <Toaster />
              </SubscriptionProvider>
            </TooltipProvider>
          </ThemeProvider>
        </>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Opening your private dream space…</p>
        </div>
      )}
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
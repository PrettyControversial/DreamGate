import { Capacitor } from "@capacitor/core";
import { apiRequest } from "./queryClient";
import { isAppleSignInCancellation } from "./apple-sign-in";

export const manualAppleRevocationInstructions =
  "Open your iPhone Settings → your name → Sign in with Apple → Psyra → Stop Using Apple ID (or Delete).";

function confirmManualRevocation(): boolean {
  return window.confirm(
    `Your Psyra account and data will be deleted, but Apple authorization cannot be removed automatically here. ${manualAppleRevocationInstructions} Continue with account deletion?`,
  );
}

export async function deleteCurrentAccount(): Promise<"deleted" | "manual_required" | "cancelled"> {
  const requirements = await (
    await apiRequest("GET", "/api/account/deletion-requirements")
  ).json() as { appleReauthorizationRequired: boolean };
  let input: { appleAuthorizationCode?: string; manualAppleRevocation?: boolean } = {};
  if (requirements.appleReauthorizationRequired) {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      try {
        const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
        const { response } = await SignInWithApple.authorize({
          clientId: "",
          redirectURI: "",
          nonce: crypto.randomUUID(),
        });
        if (!response.authorizationCode) throw new Error("Apple did not return an authorization code.");
        input.appleAuthorizationCode = response.authorizationCode;
      } catch (error) {
        if (isAppleSignInCancellation(error)) return "cancelled";
        // TN3194: a user without a usable Apple credential must still be able
        // to delete their account, with explicit manual-revocation guidance.
        if (!confirmManualRevocation()) return "cancelled";
        input = { manualAppleRevocation: true };
      }
    } else {
      // Native Apple authorization is unavailable in browsers/Android. Do not
      // claim revocation succeeded or block account deletion indefinitely.
      if (!confirmManualRevocation()) return "cancelled";
      input.manualAppleRevocation = true;
    }
  }
  const response = await apiRequest("DELETE", "/api/account", input);
  return response.status === 204 ? "deleted" : "manual_required";
}

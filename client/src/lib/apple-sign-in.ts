import type { SignInResource, SignUpResource } from "@clerk/shared/types";

type AppleCredential = {
  identityToken: string;
  givenName?: string | null;
  familyName?: string | null;
};

type SignInResult = Pick<SignInResource, "status" | "createdSessionId"> & {
  firstFactorVerification: { status: string | null };
};
type SignUpResult = Pick<SignUpResource, "status" | "createdSessionId"> & {
  verifications: { externalAccount: { status: string | null } };
};

type AppleAuthClient = {
  signIn: {
    create: (params: Parameters<SignInResource["create"]>[0]) => Promise<SignInResult>;
  };
  signUp: {
    create: (params: Parameters<SignUpResource["create"]>[0]) => Promise<SignUpResult>;
  };
};

export type AppleAuthenticationResult = {
  sessionId: string | null;
  nextStep: "sign-in" | "sign-up";
};

function signInResult(result: SignInResult): AppleAuthenticationResult {
  return {
    sessionId: result.status === "complete" ? result.createdSessionId : null,
    nextStep: "sign-in",
  };
}

/**
 * Mirrors Clerk's native Apple flow: sign up first to retain the name Apple
 * supplies only on first authorization, then transfer existing accounts.
 * Clerk, not the client, verifies the Apple token and links identities.
 */
export async function exchangeAppleIdentityToken(
  client: AppleAuthClient,
  credential: AppleCredential,
): Promise<AppleAuthenticationResult> {
  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token. Please try again.");
  }

  let signUp: SignUpResult;
  try {
    signUp = await client.signUp.create({
      strategy: "oauth_token_apple",
      token: credential.identityToken,
      ...(credential.givenName ? { firstName: credential.givenName } : {}),
      ...(credential.familyName ? { lastName: credential.familyName } : {}),
    });
  } catch (error) {
    const errors = (error as { errors?: Array<{ code?: string }> } | null)?.errors;
    const restricted = errors?.some(({ code }) =>
      code === "sign_up_mode_restricted" || code === "sign_up_restricted_waitlist",
    );
    if (!restricted) throw error;

    // A restricted instance must still allow an existing Apple user to sign in.
    const signIn = await client.signIn.create({
      strategy: "oauth_token_apple",
      token: credential.identityToken,
    });
    if (signIn.firstFactorVerification.status === "transferable") throw error;
    return signInResult(signIn);
  }

  if (signUp.verifications.externalAccount.status === "transferable") {
    return signInResult(await client.signIn.create({ transfer: true }));
  }

  return {
    sessionId: signUp.status === "complete" ? signUp.createdSessionId : null,
    nextStep: "sign-up",
  };
}

export function isAppleSignInCancellation(error: unknown): boolean {
  const response = error as { code?: string | number; message?: string } | null;
  return String(response?.code) === "1001" ||
    response?.code === "ERR_REQUEST_CANCELED" ||
    // The Capacitor plugin currently returns Apple's localized error without a code.
    /AuthorizationError.*\b1001\b|request (?:was )?cancell?ed/i.test(response?.message ?? "");
}

export function appleSignInErrorMessage(error: unknown): string {
  const response = error as {
    errors?: Array<{ longMessage?: string; message?: string }>;
    message?: string;
  } | null;
  return response?.errors?.[0]?.longMessage ||
    response?.errors?.[0]?.message ||
    response?.message ||
    "We couldn't sign in with Apple. Please try again.";
}

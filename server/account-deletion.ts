import { revokeAppleAuthorization } from "./apple-token-revocation";

export type DeletionInput = {
  appleAuthorizationCode?: string;
  manualAppleRevocation?: boolean;
};

type DeletionUser = {
  externalAccounts: Array<{ provider: string; providerUserId: string }>;
};

export function appleSubjects(user: DeletionUser): string[] {
  return user.externalAccounts
    .filter((account) => account.provider === "apple" || account.provider === "oauth_apple")
    .map((account) => account.providerUserId);
}

export class AppleDeletionError extends Error {
  constructor(public readonly code: "APPLE_REAUTH_REQUIRED" | "APPLE_REVOCATION_FAILED") {
    super(code);
  }
}

export async function deleteAccountForUser(
  userId: string,
  input: DeletionInput,
  dependencies: {
    getUser: (id: string) => Promise<DeletionUser>;
    deleteUserData: (id: string) => Promise<void>;
    deleteUser: (id: string) => Promise<unknown>;
    revokeApple?: typeof revokeAppleAuthorization;
  },
): Promise<"not_applicable" | "revoked" | "manual_required"> {
  const user = await dependencies.getUser(userId);
  const subjects = appleSubjects(user);
  let result: "not_applicable" | "revoked" | "manual_required" = "not_applicable";
  if (subjects.length) {
    if (input.appleAuthorizationCode) {
      try {
        await (dependencies.revokeApple ?? revokeAppleAuthorization)(input.appleAuthorizationCode, subjects);
        result = "revoked";
      } catch {
        // Do not log upstream errors: they may contain tokens or credentials.
        throw new AppleDeletionError("APPLE_REVOCATION_FAILED");
      }
    } else if (input.manualAppleRevocation === true) {
      // Apple's TN3194 requires fulfilling deletion even without a token.
      // The client explicitly explains and confirms manual revocation first.
      result = "manual_required";
    } else {
      throw new AppleDeletionError("APPLE_REAUTH_REQUIRED");
    }
  }
  await dependencies.deleteUserData(userId);
  await dependencies.deleteUser(userId);
  return result;
}

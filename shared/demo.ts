export const DEMO_EMAIL = "demo@askpsyra.com";

export interface DemoIdentity {
  id: string;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification: { status: string } | null;
  }>;
  privateMetadata: Record<string, unknown>;
}

export function hasVerifiedDemoEmail(user: DemoIdentity): boolean {
  return user.emailAddresses.some(email =>
    email.id === user.primaryEmailAddressId &&
    email.emailAddress.toLowerCase() === DEMO_EMAIL &&
    email.verification?.status === "verified",
  );
}

// Only the server reads privateMetadata. Matching an email alone, public
// metadata, or a development entitlement can never grant this exception.
export function hasDemoPremium(user: DemoIdentity): boolean {
  return hasVerifiedDemoEmail(user) && user.privateMetadata.is_demo === true;
}

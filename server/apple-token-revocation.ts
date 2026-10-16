import { createPrivateKey, sign } from "node:crypto";

const APPLE_ISSUER = "https://appleid.apple.com";

export type AppleRevocationConfig = {
  teamId: string;
  keyId: string;
  clientId: string;
  privateKey: string;
};

export function appleRevocationConfig(): AppleRevocationConfig {
  const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY } = process.env;
  if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID || !APPLE_PRIVATE_KEY) {
    throw new Error("Apple revocation is not configured");
  }
  // Native authorization codes belong to the existing bundle ID, not a web
  // Services ID or the Team-ID-prefixed application identifier.
  if (APPLE_CLIENT_ID !== "com.ninebynine.psyra") {
    throw new Error("Apple native client ID does not match this app");
  }
  return {
    teamId: APPLE_TEAM_ID,
    keyId: APPLE_KEY_ID,
    clientId: APPLE_CLIENT_ID,
    privateKey: APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

export function createAppleClientSecret(config: AppleRevocationConfig, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = [
    encode({ alg: "ES256", kid: config.keyId }),
    encode({
      iss: config.teamId,
      iat: issuedAt,
      exp: issuedAt + 300,
      aud: APPLE_ISSUER,
      sub: config.clientId,
    }),
  ].join(".");
  const key = createPrivateKey(config.privateKey);
  if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
    throw new Error("Apple signing key must be an EC P-256 private key");
  }
  const signature = sign("sha256", Buffer.from(unsigned), {
    key,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${unsigned}.${signature}`;
}

/**
 * Exchange a fresh native authorization code, bind it to the authenticated
 * Clerk user's Apple identity, then revoke the returned refresh token.
 * Nothing is persisted, returned to the client, or logged.
 */
export async function revokeAppleAuthorization(
  authorizationCode: string,
  expectedSubjects: string[],
  config = appleRevocationConfig(),
  request: typeof fetch = fetch,
): Promise<void> {
  const clientSecret = createAppleClientSecret(config);
  const post = (path: string, fields: Record<string, string>) => request(`${APPLE_ISSUER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: clientSecret,
      ...fields,
    }),
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  const response = await post("/auth/token", {
    code: authorizationCode,
    grant_type: "authorization_code",
  });
  if (!response.ok) throw new Error("Apple authorization exchange failed");
  const tokens = await response.json() as {
    id_token?: string;
    refresh_token?: string;
    access_token?: string;
  };
  // This ID token comes directly from Apple's authenticated HTTPS token
  // endpoint, NOT from the request body. Apple has validated the one-use code.
  // Bind that trusted response to Clerk's providerUserId before any revocation.
  if (typeof tokens.id_token !== "string") throw new Error("Missing Apple identity");
  const segments = tokens.id_token.split(".");
  if (segments.length !== 3) throw new Error("Invalid Apple identity");
  const claims = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
  if (
    claims.iss !== APPLE_ISSUER ||
    claims.aud !== config.clientId ||
    typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000 ||
    typeof claims.sub !== "string" || !expectedSubjects.includes(claims.sub)
  ) {
    throw new Error("Apple identity does not match the signed-in account");
  }
  const refreshToken = typeof tokens.refresh_token === "string" ? tokens.refresh_token : "";
  const accessToken = typeof tokens.access_token === "string" ? tokens.access_token : "";
  const token = refreshToken || accessToken;
  if (!token) throw new Error("Apple did not return a revocable token");
  const revoked = await post("/auth/revoke", {
    token,
    token_type_hint: refreshToken ? "refresh_token" : "access_token",
  });
  if (!revoked.ok) throw new Error("Apple token revocation failed");
}

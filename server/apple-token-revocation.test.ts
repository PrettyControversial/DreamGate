import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import test from "node:test";
import {
  createAppleClientSecret,
  revokeAppleAuthorization,
  type AppleRevocationConfig,
} from "./apple-token-revocation";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const config: AppleRevocationConfig = {
  teamId: "TESTTEAM00",
  keyId: "TESTKEY000",
  clientId: "com.ninebynine.psyra",
  privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
};
const claims = {
  iss: "https://appleid.apple.com",
  aud: config.clientId,
  sub: "apple-current-user",
  exp: Math.floor(Date.now() / 1000) + 300,
};
function responseToken(overrides = {}) {
  // Only simulates the trusted token endpoint's response; never a client token.
  return `header.${Buffer.from(JSON.stringify({ ...claims, ...overrides })).toString("base64url")}.signature`;
}
function mockApple(options: {
  tokenStatus?: number;
  revokeStatus?: number;
  tokens?: Record<string, unknown>;
} = {}) {
  const calls: Array<{ url: string; form: URLSearchParams }> = [];
  const request: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), form: new URLSearchParams(String(init?.body)) });
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal);
    if (String(url).endsWith("/auth/token")) {
      return Response.json(options.tokens ?? {
        id_token: responseToken(),
        refresh_token: "fake-refresh",
        access_token: "fake-access",
      }, { status: options.tokenStatus ?? 200 });
    }
    assert.equal(String(url), "https://appleid.apple.com/auth/revoke");
    return new Response(null, { status: options.revokeStatus ?? 200 });
  };
  return { request, calls };
}

test("client secret is an Apple ES256 JWT with short expiry and the native audience", () => {
  const now = 1_800_000_000_000;
  const secret = createAppleClientSecret(config, now);
  const [header, body, signature] = secret.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(header, "base64url").toString()), {
    alg: "ES256", kid: config.keyId,
  });
  assert.deepEqual(JSON.parse(Buffer.from(body, "base64url").toString()), {
    iss: config.teamId,
    iat: now / 1000,
    exp: now / 1000 + 300,
    aud: "https://appleid.apple.com",
    sub: "com.ninebynine.psyra",
  });
  assert.ok(verify("sha256", Buffer.from(`${header}.${body}`), {
    key: publicKey, dsaEncoding: "ieee-p1363",
  }, Buffer.from(signature, "base64url")));
});

test("exchanges a one-use authorization code, then revokes the refresh token", async () => {
  const mock = mockApple();
  await revokeAppleAuthorization("fake-one-use-code", [claims.sub], config, mock.request);
  assert.equal(mock.calls.length, 2);
  assert.equal(mock.calls[0].url, "https://appleid.apple.com/auth/token");
  assert.equal(mock.calls[0].form.get("code"), "fake-one-use-code");
  assert.equal(mock.calls[0].form.get("grant_type"), "authorization_code");
  assert.equal(mock.calls[0].form.has("redirect_uri"), false);
  assert.equal(mock.calls[1].form.get("token"), "fake-refresh");
  assert.equal(mock.calls[1].form.get("token_type_hint"), "refresh_token");
  for (const call of mock.calls) {
    assert.equal(call.form.get("client_id"), config.clientId);
    assert.ok(call.form.get("client_secret"));
  }
});

test("uses the access token when Apple does not return a refresh token", async () => {
  const mock = mockApple({ tokens: { id_token: responseToken(), access_token: "fake-access" } });
  await revokeAppleAuthorization("fake-code", [claims.sub], config, mock.request);
  assert.equal(mock.calls[1].form.get("token"), "fake-access");
  assert.equal(mock.calls[1].form.get("token_type_hint"), "access_token");
});

for (const [name, overrides] of Object.entries({
  "another Apple user": { sub: "someone-else" },
  "another app": { aud: "another.bundle" },
  "wrong issuer": { iss: "https://untrusted.example" },
  "expired identity": { exp: 1 },
})) {
  test(`does not revoke a token for ${name}`, async () => {
    const mock = mockApple({ tokens: { id_token: responseToken(overrides), refresh_token: "fake" } });
    await assert.rejects(revokeAppleAuthorization("fake-code", [claims.sub], config, mock.request));
    assert.equal(mock.calls.length, 1);
  });
}

test("rejects Apple exchange errors without attempting revocation", async () => {
  const mock = mockApple({ tokenStatus: 400, tokens: { error: "invalid_grant" } });
  await assert.rejects(revokeAppleAuthorization("expired-code", [claims.sub], config, mock.request));
  assert.equal(mock.calls.length, 1);
});

test("rejects missing identity or revocable tokens", async () => {
  for (const tokens of [{ refresh_token: "fake" }, { id_token: responseToken() }]) {
    const mock = mockApple({ tokens });
    await assert.rejects(revokeAppleAuthorization("fake-code", [claims.sub], config, mock.request));
    assert.equal(mock.calls.length, 1);
  }
});

test("reports Apple revocation failure instead of success", async () => {
  const mock = mockApple({ revokeStatus: 400 });
  await assert.rejects(revokeAppleAuthorization("fake-code", [claims.sub], config, mock.request));
});

test("network errors do not become a successful revocation", async () => {
  await assert.rejects(revokeAppleAuthorization("fake-code", [claims.sub], config, async () => {
    throw new Error("network unavailable");
  }));
});

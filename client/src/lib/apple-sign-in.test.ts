import test from "node:test";
import assert from "node:assert/strict";
import { exchangeAppleIdentityToken, isAppleSignInCancellation } from "./apple-sign-in";

type Client = Parameters<typeof exchangeAppleIdentityToken>[0];
const credential = { identityToken: "unit-test-token", givenName: "Test", familyName: "Dreamer" };
const newUser = {
  status: "complete" as const,
  createdSessionId: "session-new",
  verifications: { externalAccount: { status: "verified" } },
};

test("Apple new user uses Clerk's token verification and captures first-authorization name", async () => {
  const client: Client = {
    signUp: { create: async (params) => {
      assert.deepEqual(params, { strategy: "oauth_token_apple", token: credential.identityToken, firstName: "Test", lastName: "Dreamer" });
      return newUser;
    } },
    signIn: { create: async () => { throw new Error("must not sign in or overwrite another account"); } },
  };
  assert.deepEqual(await exchangeAppleIdentityToken(client, credential), {
    sessionId: "session-new", nextStep: "sign-up",
  });
});

test("returning Apple account transfers through Clerk rather than matching emails locally", async () => {
  const client: Client = {
    signUp: { create: async (params) => {
      assert.equal("emailAddress" in params, false);
      return { ...newUser, status: "missing_requirements", createdSessionId: null, verifications: { externalAccount: { status: "transferable" } } };
    } },
    signIn: { create: async (params) => {
      assert.deepEqual(params, { transfer: true });
      return { status: "complete", createdSessionId: "session-existing", firstFactorVerification: { status: "verified" } };
    } },
  };
  assert.equal((await exchangeAppleIdentityToken(client, { identityToken: "test-token" })).sessionId, "session-existing");
});

test("MFA and incomplete signup never activate a session prematurely", async () => {
  const client: Client = {
    signUp: { create: async () => ({ ...newUser, verifications: { externalAccount: { status: "transferable" } } }) },
    signIn: { create: async () => ({
      status: "needs_second_factor", createdSessionId: null, firstFactorVerification: { status: "verified" },
    }) },
  };
  assert.deepEqual(await exchangeAppleIdentityToken(client, credential), { sessionId: null, nextStep: "sign-in" });
  client.signUp.create = async () => ({ ...newUser, status: "missing_requirements", createdSessionId: null });
  assert.deepEqual(await exchangeAppleIdentityToken(client, credential), { sessionId: null, nextStep: "sign-up" });
});

test("missing or rejected Apple tokens never fall back to passwordless access", async () => {
  let calls = 0;
  const client: Client = {
    signUp: { create: async () => { calls++; throw new Error("invalid token"); } },
    signIn: { create: async () => { throw new Error("must not be called"); } },
  };
  await assert.rejects(exchangeAppleIdentityToken(client, { identityToken: "" }), /identity token/);
  assert.equal(calls, 0);
  await assert.rejects(exchangeAppleIdentityToken(client, credential), /invalid token/);
});

test("restricted signup permits only existing Apple accounts", async () => {
  const restriction = { errors: [{ code: "sign_up_mode_restricted" }] };
  const client: Client = {
    signUp: { create: async () => { throw restriction; } },
    signIn: { create: async (params) => {
      assert.deepEqual(params, { strategy: "oauth_token_apple", token: credential.identityToken });
      return { status: "complete", createdSessionId: "existing", firstFactorVerification: { status: "verified" } };
    } },
  };
  assert.equal((await exchangeAppleIdentityToken(client, credential)).sessionId, "existing");
  client.signIn.create = async () => ({
    status: "needs_first_factor", createdSessionId: null, firstFactorVerification: { status: "transferable" },
  });
  await assert.rejects(exchangeAppleIdentityToken(client, credential), (error) => error === restriction);
});

test("Apple cancellation is not reported as a failed login", () => {
  assert.equal(isAppleSignInCancellation({ code: 1001 }), true);
  assert.equal(isAppleSignInCancellation({ message: "The operation couldn’t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)" }), true);
  assert.equal(isAppleSignInCancellation({ message: "The request was cancelled." }), true);
  assert.equal(isAppleSignInCancellation({ message: "Invalid Apple token" }), false);
});

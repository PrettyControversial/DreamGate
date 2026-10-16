import assert from "node:assert/strict";
import test from "node:test";
import { appleSubjects, deleteAccountForUser } from "./account-deletion";

function fixture(provider = "apple", revokeFails = false) {
  const operations: string[] = [];
  return {
    operations,
    dependencies: {
      getUser: async (id: string) => {
        assert.equal(id, "current-user");
        operations.push("getUser");
        return { externalAccounts: [{ provider, providerUserId: "current-apple-sub" }] };
      },
      revokeApple: async (code: string, subjects: string[]) => {
        assert.equal(code, "fresh-code");
        assert.deepEqual(subjects, ["current-apple-sub"]);
        operations.push("revoke");
        if (revokeFails) throw new Error("secret upstream diagnostic");
      },
      deleteUserData: async (id: string) => {
        assert.equal(id, "current-user");
        operations.push("deleteData");
      },
      deleteUser: async (id: string) => {
        assert.equal(id, "current-user");
        operations.push("deleteClerk");
      },
    },
  };
}

test("Apple identity is taken from server-side Clerk data, not email/client subject", () => {
  assert.deepEqual(appleSubjects({ externalAccounts: [
    { provider: "google", providerUserId: "other" },
    { provider: "apple", providerUserId: "apple-sub" },
    { provider: "oauth_apple", providerUserId: "legacy-sub" },
  ] }), ["apple-sub", "legacy-sub"]);
});

test("revokes Apple before deleting only the authenticated user's data and Clerk account", async () => {
  const { operations, dependencies } = fixture();
  assert.equal(await deleteAccountForUser("current-user", {
    appleAuthorizationCode: "fresh-code",
  }, dependencies), "revoked");
  assert.deepEqual(operations, ["getUser", "revoke", "deleteData", "deleteClerk"]);
});

test("non-Apple deletion does not require Apple secrets or a token", async () => {
  const { operations, dependencies } = fixture("google");
  assert.equal(await deleteAccountForUser("current-user", {}, dependencies), "not_applicable");
  assert.deepEqual(operations, ["getUser", "deleteData", "deleteClerk"]);
});

test("missing Apple code requires reauthorization, not silent unrevoked deletion", async () => {
  const { operations, dependencies } = fixture();
  await assert.rejects(deleteAccountForUser("current-user", {}, dependencies), {
    message: "APPLE_REAUTH_REQUIRED",
  });
  assert.deepEqual(operations, ["getUser"]);
});

test("failed revocation leaves all user data and Clerk identity untouched", async () => {
  const { operations, dependencies } = fixture("apple", true);
  await assert.rejects(deleteAccountForUser("current-user", {
    appleAuthorizationCode: "fresh-code",
  }, dependencies), { message: "APPLE_REVOCATION_FAILED" });
  assert.deepEqual(operations, ["getUser", "revoke"]);
});

test("explicit manual fallback fulfills deletion without falsely claiming revocation", async () => {
  const { operations, dependencies } = fixture();
  assert.equal(await deleteAccountForUser("current-user", {
    manualAppleRevocation: true,
  }, dependencies), "manual_required");
  assert.deepEqual(operations, ["getUser", "deleteData", "deleteClerk"]);
});

test("a provided code must be revoked even if manual fallback is also requested", async () => {
  const { operations, dependencies } = fixture("apple", true);
  await assert.rejects(deleteAccountForUser("current-user", {
    appleAuthorizationCode: "fresh-code", manualAppleRevocation: true,
  }, dependencies));
  assert.deepEqual(operations, ["getUser", "revoke"]);
});

test("failed Clerk lookup never deletes any user's data", async () => {
  const { operations, dependencies } = fixture();
  dependencies.getUser = async () => { throw new Error("Clerk unavailable"); };
  await assert.rejects(deleteAccountForUser("current-user", {}, dependencies));
  assert.deepEqual(operations, []);
});

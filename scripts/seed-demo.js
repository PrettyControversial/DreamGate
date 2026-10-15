// Run against the published app:
// node scripts/seed-demo.js --url https://YOUR-PUBLISHED-APP
// DEMO_SEED_TOKEN is read from Secrets; passwords never enter this request.
const urlIndex = process.argv.indexOf("--url");
const target = process.argv[urlIndex + 1];
if (urlIndex < 0 || !target) throw new Error("Pass --url with the published app URL. No environment is selected implicitly.");
const url = new URL(target);
if (url.protocol !== "https:" || url.username || url.password) throw new Error("Use an HTTPS app URL without embedded credentials.");
const token = process.env.DEMO_SEED_TOKEN;
if (!token || token.length < 32) throw new Error("Set DEMO_SEED_TOKEN in Secrets (at least 32 characters).");
const response = await fetch(new URL("/internal/demo/seed", url), {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(300000),
  redirect: "error",
});
if (!response.ok) {
  const body = await response.json().catch(() => null);
  const allowedPhases = new Set([
    "validate_secrets",
    "lookup_demo_account",
    "create_demo_account",
    "verify_demo_email",
    "verify_demo_identity",
    "interpret_demo_dreams",
    "replace_demo_journal",
    "build_archetype_profile",
    "grant_demo_access",
    "unknown",
  ]);
  const phase =
    body && allowedPhases.has(body.phase) ? body.phase : "unknown";
  throw new Error(`Demo seed failed (${response.status}, phase: ${phase}). No credentials or journal contents were returned.`);
}
console.log(JSON.stringify(await response.json(), null, 2));

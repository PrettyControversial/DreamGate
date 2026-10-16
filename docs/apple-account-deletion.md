# Apple authorization revocation on account deletion

## Required production Secrets

Add these server-only entries to **Publishing → Adjust settings → Production app
secrets** before publishing this change. Add the same names to workspace Secrets
only if testing against the development backend. Never use a `VITE_` prefix.

| Name | Value |
| --- | --- |
| `APPLE_CLIENT_ID` | `com.ninebynine.psyra` — the existing native bundle ID, not a web Services ID and not prefixed with the Team ID |
| `APPLE_TEAM_ID` | Your Apple Developer membership's 10-character Team ID |
| `APPLE_KEY_ID` | The 10-character key ID of a Sign in with Apple-enabled private key associated with this app's primary App ID |
| `APPLE_PRIVATE_KEY` | The complete contents of that downloaded `AuthKey_<KEY_ID>.p8` file, including `-----BEGIN PRIVATE KEY-----`, all intervening lines, and `-----END PRIVATE KEY-----` |

Apple Developer → Certificates, Identifiers & Profiles → Keys: use an existing
Sign in with Apple key configured for the app, or register a new key, enable
Sign in with Apple, configure the primary App ID for `com.ninebynine.psyra`, and
download the `.p8` key. Apple allows a key download only once. Keep it private.
The Team ID is in Apple Developer → Membership details. Do not use the App ID
prefix if it differs from the Team ID.

The private key can be pasted as real multiline PEM text; literal `\n` line
separators are also supported. No pre-generated `APPLE_CLIENT_SECRET` is needed:
the server creates a five-minute ES256 client-secret JWT for each operation.
Do not paste credentials in chat or commit the `.p8` file. These backend Secrets
are separate from enabling Apple login in Replit-managed Clerk.

## Behavior

- The server checks the **authenticated Clerk user's** linked external accounts.
  It never takes a user ID, email, Apple subject, or token-revocation URL from
  the deletion request.
- For an Apple-linked account, the iOS client requests fresh Apple authorization
  when the user confirms account deletion. Cancelling that sheet cancels deletion.
  This works for users who signed in before this implementation; no previously
  stored refresh token is required.
- The server exchanges the short-lived, one-use native authorization code at
  `https://appleid.apple.com/auth/token`. It checks the identity returned directly
  by Apple's authenticated HTTPS endpoint against the configured native client
  and the authenticated user's Clerk `providerUserId`.
- It sends the returned refresh token (or access token if no refresh token was
  returned) to `https://appleid.apple.com/auth/revoke`.
- Only after Apple's successful response does it delete app data and the Clerk
  account, using the existing deletion logic. Apple exchange/revocation/config
  failures do not delete account data. Retry obtains a new code.
- No Apple credentials or token responses are logged or persisted. There are no
  new database fields, migrations, or native project changes.
- A browser cannot present the native Apple sheet. If no usable native
  authorization can be obtained, the UI explicitly asks whether to proceed
  with deletion and explains how to manually remove Apple authorization in
  iPhone Settings. It repeats these instructions after deletion. This fallback
  is **not** reported as successful automatic revocation.
- Email/password-only users retain the same deletion behavior and need none
  of these Apple Secrets.

Apple explicitly requires fulfilling deletion even without a usable token,
with manual-revocation guidance:
[TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple).
The [revocation API](https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens)
accepts access/refresh tokens, **not** an identity JWT.

## Release verification

Publish the backend with all four production Secrets, then rebuild/sync the
updated client on the Mac as in `docs/apple-sign-in.md`. `ios/` and the existing
bundle ID are unchanged by this implementation.

On a physical iPhone using disposable test accounts:

1. Sign in with Apple, choose Delete Account, and cancel the Apple sheet:
   account and data must remain.
2. Repeat, authorize the same Apple ID, and confirm deletion succeeds. Verify
   app data and Clerk account are gone and Apple no longer authorizes this app.
3. Use a different Apple ID in the deletion sheet: the server must reject it
   without deleting the signed-in account.
4. Verify Hide My Email accounts and accounts created before this update.
5. Verify a password-only test account can delete without Apple authorization.
6. Test browser deletion for an Apple-linked disposable account: explicit
   manual-revocation confirmation and instructions must appear.

Automated tests mock Apple and Clerk; they do not validate real production
credentials or revoke/delete real users. A live iPhone/Apple end-to-end test
is still required before claiming that production revocation is verified.

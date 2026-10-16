# Native Sign in with Apple setup

The iOS login and account-creation screens now use Apple's native authorization
sheet through `@capacitor-community/apple-sign-in`. The returned identity token
is verified by Clerk using `oauth_token_apple`. Clerk owns account linking; the
app never matches users by email or changes another user's data. New users keep
the existing first-sign-in data provisioning path.

This is native iOS authentication only. Web/Android login is unchanged. No
browser OAuth callback, Services ID, or redirect URI is used by this native
implementation. Apple's Hide My Email option is supported; its relay address is
handled by Clerk, not replaced by the app.

## Required production authentication configuration

- Enable Apple for sign-up and sign-in in Replit's **Auth → Configure** pane,
  selecting the **Production** environment. Do not paste Apple keys into chat.
- Clerk must recognize the iOS native application with the actual Apple App ID
  prefix and bundle identifier **com.ninebynine.psyra**. This is a Clerk
  native-application setting, not a source-code setting. It needs authorized
  Clerk administration access. If that access is unavailable, an authorized
  administrator must complete it before native token verification will work.
- If Apple asks for web OAuth credentials in the Auth pane, those configure its
  separate browser OAuth flow; they do not replace native app registration.
- Configure Apple Private Email Relay for Clerk's email-sending domain if email
  delivery to Hide My Email users is needed.

## Apply the native changes yourself on the Mac

No files inside `ios/` were edited by the agent.

1. Pull `codex/dream-atlas-redesign` on your Mac and run `npm ci`.
2. Build using the **same production native build settings you already use**.
   Keep `VITE_API_BASE_URL` set to the verified published backend HTTPS URL and
   retain the production Clerk build configuration. Do not build a submission
   binary with development Clerk keys.
3. Run:

   ```sh
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

   `cap sync` is deliberately left for you to run: it updates your local native
   project and installs the new Apple sign-in CocoaPod.
4. In Xcode, select **App project → App target → Signing & Capabilities**.
   Confirm the bundle identifier is **com.ninebynine.psyra** and keep it unchanged.
   Select your existing Apple Developer team.
5. Click **+ Capability**, then add **Sign in with Apple**. Xcode adds the
   `com.apple.developer.applesignin` entitlement with `Default` to the target.
   Ensure the capability applies to both Debug and Release configurations.
6. In Apple Developer → Certificates, Identifiers & Profiles → Identifiers,
   select the existing explicit App ID for **com.ninebynine.psyra** and ensure
   **Sign in with Apple** is enabled. Do not create a different bundle ID.
7. Let automatic signing refresh the provisioning profile, or regenerate your
   distribution profile if you manage profiles manually.
8. Build and test on a physical iPhone before archiving for App Store submission.

## Release checks

- First-time Apple login, including **Hide My Email**, creates a Clerk user and
  reaches the normal signed-in app.
- Sign out and sign in again: it returns to that same Clerk user and dream data.
- Cancel the Apple sheet: remain signed out with no error or app data writes.
- Existing email/password login and password recovery still work.
- Accounts requiring MFA still complete that verification before activation.
- Confirm the bundle ID remains `com.ninebynine.psyra`.

Native Apple authorization and production credentials cannot be verified from
the web preview. Do not consider Apple sign-in release-ready until these device
and production checks pass.

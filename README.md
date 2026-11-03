# MDATE authentication overlay

This ZIP is a root-relative overlay for `raichiiiiiii/MDATE-P-2`. Copy the contents into the repository root and allow the listed files to be replaced.

## Included changes

- Replaces the placeholder custom auth UI with email/password sign-in, open sign-up, password confirmation, password visibility, and password reset.
- Native iOS/Android use Auth0's password-realm grant and the configured Auth0 Database Connection.
- Web uses the branded MDATE screen followed by Auth0 Universal Login. The React Native Auth0 SDK does not support password-realm grant on web; do not attempt to submit browser passwords to that native-only method.
- Keeps Auth0 as the credential store and PostgreSQL as the application-account store.
- Synchronizes Auth0 email and email_verified claims from the validated access token during idempotent account bootstrap.
- Preserves the default patient role assignment; the client cannot choose a role.
- Adds Auth0 Dashboard setup and local verification instructions.

## Important deployment work outside the source tree

1. Set `EXPO_PUBLIC_AUTH0_DATABASE_CONNECTION` to the exact Auth0 Database Connection name.
2. Enable the Password grant on the Native Auth0 application only. Configure the web SPA to use Universal Login.
3. Ensure the Auth0 Database Connection permits unverified users to sign in, because MDATE email verification is optional.
4. Deploy the Post Login Action in `docs/authentication/README.md` to add namespaced email claims to the MDATE API access token. Without the Action, bootstrap still works but the email fields will not be synchronized from Auth0.
5. Configure the correct API audience, native callback URLs, web callback/origin URLs and Auth0 password-reset email template.

## Merge and test

From the repository root, extract this archive so that `src/` and `docs/` merge with the existing folders. Then run:

```powershell
cd src/express-test
npm run typecheck
npm run build

cd ../expo-test
npx expo install --check
npx tsc --noEmit
```

`npx tsc --noEmit` may depend on the Expo TypeScript configuration / installed project dependencies. Then follow the manual scenarios in `docs/authentication/README.md` on both a native development build and the web build.

This overlay has not been typechecked against the full repository in this environment. Review the Auth0 tenant settings and test login/signup before merging into `main`.

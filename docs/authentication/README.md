# MDATE authentication setup

This implementation keeps Auth0 as the credential provider and PostgreSQL as the MDATE application-account store.

## Authentication flow

- **Native iOS/Android:** the MDATE-branded screen collects email and password. Sign-up calls the Auth0 Database Connection signup endpoint through the React Native SDK, then signs in with Auth0's password-realm grant.
- **Web:** the MDATE-branded screen remains the entry point. The SDK does not support password-realm authentication in browsers, so sign-in continues in Auth0 Universal Login using Authorization Code + PKCE. The custom sign-up form creates the Auth0 database identity, then opens the hosted login page to obtain tokens; the user may need to enter the password again there because the SDK signup call does not establish the browser login session.
- The SDK stores native credentials in the platform secure credential store. The app requests an Auth0 access token for the MDATE API and sends it to Express. Never send the ID token to the API as its bearer token.
- Express validates the access token and obtains the immutable Auth0 subject. PostgreSQL links that subject to one MDATE user and assigns the default `patient` role. The bootstrap operation is safe to retry.
- MDATE never stores or compares passwords. It stores application profile, preferences, account status, role assignments, and the Auth0 subject mapping.

## Auth0 Dashboard configuration

1. Create or select a **Native** Auth0 application for iOS/Android and a separate **Single Page Application** for the web build.
2. Create/enable a first-party **Database Connection** (for example, `Username-Password-Authentication`) and enable it for the relevant Auth0 applications. Configure email as the login identifier; this implementation does not collect or submit a separate username.
3. Set the exact connection name in `EXPO_PUBLIC_AUTH0_DATABASE_CONNECTION`.
4. For native custom email/password sign-in, enable the **Password** grant type for the Native application only. The SDK's password-realm method is not supported on web. This is a Resource Owner Password Grant flow. Auth0 recommends browser-based authentication instead and describes this grant as a last resort; keep it limited to this first-party native database connection and do not use it for social login, federation, or MFA flows. Revisit this choice before production if MFA, passkeys, or federated providers are required.
5. Configure the MDATE API identifier to match `EXPO_PUBLIC_AUTH0_AUDIENCE` and the Express `AUTH0_AUDIENCE`.
6. Configure the Native application callback URLs to match the app's scheme, package and bundle identifiers. With the current values, the expected callback URLs are:
   - `mdateauth0://mdate.au.auth0.com/ios/com.mdate.app/callback`
   - `mdateauth0://mdate.au.auth0.com/android/com.mdate.app/callback`
7. Add the web development origin (currently `http://localhost:8081`) to the SPA's Allowed Callback URLs, Allowed Logout URLs and Allowed Web Origins as appropriate for the Auth0 SDK web setup. Add production origins before deployment.
8. Configure the Database Connection's password policy and reset-password email template. The app includes a password-reset request.

## Email verification policy: optional

MDATE does not block sign-in, account creation, setup, or therapy access solely because `email_verified` is false. Make sure the Auth0 Database Connection does not require email verification before allowing a password login. Auth0 may still send a verification email; it is informational until MDATE changes this policy.

To synchronize the authoritative email and verification state into PostgreSQL, create and deploy an Auth0 **Post Login Action** in the Login flow using the example in `docs/authentication/actions/post-login.js`:



The Express middleware reads these namespaced claims only from the validated JWT. The client must not submit email or verification status as trusted account data. If this Action is not deployed, account provisioning still works; the email fields remain unchanged / at their database defaults until the claims are available.

## Environment

Expo client (`src/expo-test/.env`):

```dotenv
EXPO_PUBLIC_AUTH0_DOMAIN=mdate.au.auth0.com
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.mdate.com
EXPO_PUBLIC_AUTH0_DATABASE_CONNECTION=Username-Password-Authentication
EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID=YOUR_NATIVE_CLIENT_ID
EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID=YOUR_SPA_CLIENT_ID
EXPO_PUBLIC_API_URL_WEB=http://localhost:3000
EXPO_PUBLIC_API_URL_NATIVE=http://YOUR_LAN_IP:3000
```

Express API (`src/express-test/.env`):

```dotenv
AUTH0_DOMAIN=mdate.au.auth0.com
AUTH0_AUDIENCE=https://api.mdate.com
```

Do not put an Auth0 client secret or Management API secret in either Expo environment file. Values prefixed with `EXPO_PUBLIC_` are bundled into the client and are public.

## Local verification checklist

- Native: sign-up with a new email; verify Auth0 identity creation; confirm the SDK receives an API access token; confirm exactly one PostgreSQL user, one Auth0 subject mapping and one `patient` role are created.
- Native: sign in with correct credentials; wrong credentials return a generic sign-in error (not an account-existence disclosure).
- Web: sign-in opens Auth0-hosted login in the browser; sign-up creates the database identity then opens hosted login.
- Password reset: request reset and verify the configured Auth0 email delivery.
- Email not verified: sign in and complete setup without an email-verification gate; after the Post Login Action is deployed, verify PostgreSQL records `email_verified = false`.
- Repeat account bootstrap and verify that no duplicate user or role mapping is created.
- Change the Auth0 email address and sign in again; verify the PostgreSQL email value is refreshed from the signed claim.
- Verify that a client-credentials token is rejected by `requireHumanUser`, and that the frontend cannot assign therapist/admin roles.

# MDATE Splash Screen Overlay

This overlay updates the existing Expo splash screen to match the custom splash specification.

## Files

Extract this archive at the repository root. It replaces these files:

- `src/expo-test/app/_layout.tsx`
- `src/expo-test/src/features/splash/SplashScreen.tsx`
- `src/expo-test/src/features/splash/components/SplashIcon.tsx`
- `src/expo-test/src/features/splash/components/LoadingMessage.tsx`
- `src/expo-test/src/features/splash/components/LoadingProgress.tsx`

No additional package is required. The implementation uses React Native's `Animated` API and the existing Expo Router and `AuthProvider` dependencies.

## Behaviour and navigation

- The logo is displayed in a 140px circular border.
- The tip card rotates through four aphasia-friendly messages every 3 seconds.
- The progress fill animates to the progress value reported by `AuthProvider`; it does not fabricate a completed load while authentication is still pending.
- A ready account sees the progress animation reach 100%, then `router.replace()` moves to `/(app)/(main)/dashboard`.
- Signed-out accounts remain under the signed-out route guard and enter the authentication flow.
- Accounts requiring first-time setup remain under the setup route guard and enter account setup instead of being sent to the main dashboard.
- A session restoration error displays the error and a retry action.

`app/_layout.tsx` keeps the root `index` route available while the phase is `ready`. This is necessary so the splash animation can finish before the explicit dashboard replacement. The other protected route groups are unchanged.

## Verify

From `src/expo-test`:

```powershell
npx tsc --noEmit
npx expo start --web --port 8081 --clear
```

Also verify on a native development build:

1. A valid saved session animates to 100% and opens the dashboard.
2. A new account requiring setup opens account setup, not the dashboard.
3. A signed-out user reaches the authentication screen.
4. A temporary API outage shows the error and Retry button.
5. The tip message changes approximately every 3 seconds.

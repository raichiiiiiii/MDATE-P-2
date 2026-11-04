# Expo local authentication

`src/features/auth/AuthProvider.tsx` implements the first-party `useAuth()` context. It calls the Express identity endpoints for registration, login, refresh, logout, password reset, account retrieval and account setup.

- `AuthEntryScreen.tsx` collects email/password on web and native.
- `expo-secure-store` persists native refresh tokens.
- Web refresh tokens are stored in an HttpOnly Express cookie, not browser storage.
- `apiClient.ts` normalizes API errors and request types.
- `AuthFlowProvider.tsx` is a temporary compatibility re-export for existing screens.
- `app/_layout.tsx` uses `AuthProvider` and retains the existing Expo Router phase guards.

Run `npx expo install expo-secure-store`, `npm install`, then `npx tsc --noEmit`. Restart Expo with `npx expo start --web --port 8081 --clear`. Rebuild the native development client after installing SecureStore.

Copy `.env.example` to `.env`. For physical devices, set `EXPO_PUBLIC_API_URL_NATIVE` to the Windows PC's LAN IP; `localhost` on the tablet points to the tablet itself.

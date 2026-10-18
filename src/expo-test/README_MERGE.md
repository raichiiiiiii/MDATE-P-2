# MDATE AuthFlow UI redesign — merge overlay

## Files in this overlay
- `src/features/auth/AuthEntryScreen.tsx`: single simplified entry screen with email field and only two bottom actions: Sign in / Sign up.
- `src/features/auth/AuthFlowProvider.tsx`: retains splash loading milestones and passes the entered email to Auth0 as `login_hint`.
- `src/features/auth/accountApi.ts`: extends the setup request type and payload with accessibility and voice preferences.
- `app/(auth)/sign-in.tsx` and `app/(auth)/sign-up.tsx`: both render the same entry screen; the selected bottom action determines login vs signup.
- `app/(account-setup)/index.tsx`: first-time account setup for profile, language, accessibility, and voice preferences.

## Apply
1. Stop Expo (`Ctrl+C`).
2. Back up the project.
3. Extract this ZIP directly into the `expo-test` project root and allow folders/files to merge/replace.
4. Run `npx tsc --noEmit`.
5. If it passes, restart with `npx expo start --web --port 8081 --clear`.

## Important Auth0 behavior
The app intentionally does not collect a password in a native TextInput. The email is passed to Auth0 as `login_hint`, and the password is entered on Auth0's secure hosted login page. This avoids handling passwords in MDATE.

## Important backend contract
The setup form now submits:
- `displayName`, `preferredLanguage`
- `accessibilityPreferences`: `textSize`, `contrast`, `alternativeInputOn`
- `voicePreferences`: `preferredVoiceId`, `audioRate`, `audioVolume`, `voiceDisabled`

Your current frontend code previously submitted only `displayName` and `preferredLanguage`. The Express `PUT /api/v1/account/setup` validator/use case/repository must be updated to validate and persist both preference objects into `accessibility_preferences` and `voice_preferences`. Until that backend change is implemented, the UI can display the fields but the extra preference values are not guaranteed to persist. Do not treat this ZIP alone as proof that those database rows are saved.

## Fields managed by the backend/Auth0
- `users.id`, `status`, `setup_completed_at`, `created_at`, `updated_at`, `deleted_at`: backend-managed.
- `users.email` and `email_verified`: derived from the verified Auth0 identity/token where available; do not trust client-submitted values.
- `oauth_providers`: linked by the backend from the Auth0 `sub` claim.
- `roles` and `user_roles`: assigned by backend policy; users must not choose their own role.
- Preference `user_id` and `updated_at`: backend-managed.

`preferred_voice_id` is optional because the database column is nullable. Voice IDs should be selected from supported voices once that catalogue exists; the text field is an interim setup control.

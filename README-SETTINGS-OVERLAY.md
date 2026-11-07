# MDATE Settings API + Expo controls overlay

This overlay adds editable preferences to the existing MDATE Settings route. It is designed to be extracted into the repository root and merged with the existing `src/expo-test` and `src/express-test` directories.

## Scope

The Settings screen edits:

- Preferred language (`en-MY` or `ms-MY`)
- Text size (`small`, `medium`, `large`)
- Contrast (`normal`, `high`)
- Alternative input preference
- Preferred voice ID (optional)
- Speech rate (`0.5` to `2.0`, in `0.1` increments)
- Voice volume (`0.0` to `1.0`, in `0.1` increments)
- Voice output disabled/enabled

The screen loads the saved settings when it opens, keeps changes local until **Save settings** is pressed, and updates the authenticated `useAuth()` account state after a successful save.

## API contract

Both endpoints are mounted by the existing `accountRoutes` under `/api/v1` and require a valid bearer access token. They also require an active account with `setup_completed_at` set.

### Read settings

`GET /api/v1/me/preferences`

Response:

```json
{
  "preferences": {
    "preferredLanguage": "en-MY",
    "accessibilityPreferences": {
      "textSize": "medium",
      "contrast": "normal",
      "alternativeInputOn": false
    },
    "voicePreferences": {
      "preferredVoiceId": null,
      "audioRate": 1,
      "audioVolume": 1,
      "voiceDisabled": false
    }
  }
}
```

### Save settings

`PUT /api/v1/me/preferences`

The request body is the `preferences` object shown above. All fields are required because this is a full replacement operation. This avoids ambiguity around omitted nested values.

Validation rules:

- `preferredLanguage`: `ll` or `ll-RR` format, for example `en-MY` or `ms-MY`.
- `textSize`: `small`, `medium`, or `large`.
- `contrast`: `normal` or `high`.
- `alternativeInputOn` and `voiceDisabled`: booleans.
- `preferredVoiceId`: null or a string up to 100 characters.
- `audioRate`: between `0.5` and `2.0`.
- `audioVolume`: between `0.0` and `1.0`.

On success, the API returns the normalized saved preferences in the same response shape as GET.

## PostgreSQL

**No migration is required.** The existing schema already has:

- `users.preferred_language`
- `accessibility_preferences`
- `voice_preferences`

The Express repository writes all three in one transaction and only for an active, fully set-up account. A failure rolls the transaction back.

## Files in this overlay

### Expo

- `src/expo-test/app/(app)/(main)/setting.tsx` — route adapter for the new Settings screen.
- `src/expo-test/src/features/settings/SettingsScreen.tsx` — accessible controls and save/load state.
- `src/expo-test/src/features/settings/settingsApi.ts` — typed read and save API functions.
- `src/expo-test/src/features/auth/AuthProvider.tsx` — exposes `updatePreferences()` and synchronizes the returned values into `user`/`account`.

### Express

- `src/express-test/src/domain/identity/Account.ts` — shared preference domain types.
- `src/express-test/src/domain/identity/AccountRepository.ts` — adds the update contract.
- `src/express-test/src/application/preferences/UpdateAccountPreferences.ts` — application use case.
- `src/express-test/src/infrastructure/persistence/postgres/PgAccountRepository.ts` — atomic PostgreSQL update.
- `src/express-test/src/main/container.ts` — registers the use case.
- `src/express-test/src/main/http/controllers/accountController.ts` — GET/PUT controllers.
- `src/express-test/src/main/http/routes/accountRoutes.ts` — protected route registration.
- `src/express-test/src/main/http/validators/accountPreferencesSchema.ts` — request validation.

## Merge and verification

1. Back up the working tree or commit your current changes.
2. Extract the ZIP at the repository root, preserving the paths shown above.
3. Review the modified files, especially `AuthProvider.tsx`, `PgAccountRepository.ts` and `accountRoutes.ts`.
4. No SQL migration needs to be run.
5. From `src/express-test`, run:

   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```

6. From `src/expo-test`, run:

   ```powershell
   npx tsc --noEmit
   npx expo start --web --port 8081 --clear
   ```

7. Sign in with an account whose status is `ACTIVE` and whose `setup_completed_at` is not null. Open Settings, change several controls, save, leave the screen and reopen it. The saved values should be restored.

## API smoke test

Replace the token and API base URL with your local values:

```powershell
$headers = @{ Authorization = "Bearer YOUR_ACCESS_TOKEN" }
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/v1/me/preferences" -Headers $headers

$body = @{
  preferredLanguage = "ms-MY"
  accessibilityPreferences = @{
    textSize = "large"
    contrast = "high"
    alternativeInputOn = $true
  }
  voicePreferences = @{
    preferredVoiceId = $null
    audioRate = 0.9
    audioVolume = 0.8
    voiceDisabled = $false
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Put -Uri "http://localhost:3000/api/v1/me/preferences" -Headers $headers -ContentType "application/json" -Body $body
```

## Important implementation boundary

This work persists settings and synchronizes them into the authenticated account state. It does not yet make every existing screen dynamically resize its typography, switch its color palette, localize all copy, or select a voice from a runtime voice catalogue. Those effects need to be integrated into the shared UI/accessibility and speech-output layers. The controls are therefore honest preference controls, not a claim that every downstream feature already consumes each preference.

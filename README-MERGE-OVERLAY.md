# MDATE — Try to Guess Practice Screen Overlay

This overlay updates the existing q-set practice view to a card-based, aphasia-friendly guessing-game layout and connects the microphone control to the repository's existing authenticated Whisper transcription endpoint.

## Repository paths

Extract/merge this ZIP at the repository root (`MDATE-P-2/`). It contains these replacement/addition paths:

```text
src/expo-test/
  app.json
  src/features/training/
    trainingApi.ts
    speechApi.ts                         [new]
    screens/ChallengeScreen.tsx
```

The actual repository route is already:

```text
src/expo-test/app/(app)/q-sets/[qSetId].tsx
```

That route re-exports `ChallengeScreen`; no additional `select_category.jsx` route is needed. The path named in the request appears to refer to the former/legacy naming, not the route present on the current `main` branch.

## 1. Install the Expo SDK 57 packages

From PowerShell:

```powershell
cd .\src\expo-test
npx expo install expo-audio expo-speech
```

Use `npx expo install` rather than hardcoding package versions; Expo will choose versions compatible with this project's SDK 57 dependencies and update `package.json` and `package-lock.json`.

## 2. Verify the environment

The transcription request uses the current `EXPO_PUBLIC_API_URL_WEB` or `EXPO_PUBLIC_API_URL_NATIVE` value and the existing `getAuthHeaders()` authentication flow. The API must be reachable from the device/browser.

For web microphone access, use `http://localhost` during local development or HTTPS in deployed environments. Browsers require a secure context and explicit microphone permission for recording.

The backend must have its speech route available:

```text
POST /api/v1/speech/transcribe
multipart/form-data:
  audio: recording file
  language: ms | en
```

The current backend accepts WebM and M4A uploads. Expo Audio's high-quality preset records WebM on web and M4A on native platforms. The uploaded file is temporary and the backend removes it after transcription.

## 3. Apply and run

After extracting the overlay:

```powershell
cd .\src\expo-test
npx expo install expo-audio expo-speech
npx expo start -c
```

In another terminal, ensure the Express API and the local Whisper worker dependencies/model are available. Test on the web and on the Android tablet separately; browser recording and native file upload use different file-handling paths.

If you use a custom development build rather than Expo Go, rebuild the native app after adding the `expo-audio` config plugin so the microphone permission configuration is applied.

## 4. What is implemented

- Gold coin / points pill and language toggle (English / Bahasa Melayu).
- Segmented, striped question-progress bar using the current question index.
- Large image clue card using the question's media assets and localized alt text.
- Dynamic prompt via `getPrompt(question.content, language)`.
- Prompt read-aloud through `expo-speech`.
- Incremental contextual hint reveal from `question.content.hints`.
- Large microphone button: start recording, tap again to stop, upload to the authenticated Whisper endpoint, and append the transcript into the answer field.
- Keyboard control that focuses the answer field.
- Previous / next question navigation and return-to-activities navigation.
- Malay and English interface strings.

## 5. Deliberate integration boundaries

The current repository does not expose a patient points-balance endpoint or configured per-question session timer. The top-left badge therefore shows `—` rather than misrepresenting `rewardPoolPoints` (the q-set reward pool) as the patient's live balance. The progress bar shows question progress, not a made-up seconds countdown.

The current speech endpoint transcribes audio only; it does not create a therapy attempt, issue XP, or update a points balance. This screen places transcripts into the answer box but does not claim that an answer has been submitted or clinically assessed. Those actions should be wired only after the attempt/adaptation contract is implemented and reviewed.

Hint reveal does not deduct points. There is no approved hint-cost rule or live balance contract in the current codebase, so points are not silently charged.

## 6. Validation checklist

- [ ] `npx expo install expo-audio expo-speech` completes and updates the lockfile.
- [ ] `npx tsc --noEmit` passes in `src/expo-test`.
- [ ] The q-set route still loads a published q-set.
- [ ] English / Malay toggling changes prompt, hints, and interface labels.
- [ ] Prompt speaker reads the localized prompt aloud.
- [ ] Hint button reveals hints one at a time and can reset after the last hint.
- [ ] Web: browser permission is granted, recording stops, and transcript appears in the answer box.
- [ ] Android: microphone permission is granted, M4A uploads, and transcript appears in the answer box.
- [ ] Denied permission, no detected speech, and unavailable Whisper worker display recoverable messages.
- [ ] No points are added or deducted by this screen.

## References

- Expo Audio SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/audio/
- Expo Speech SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/speech/

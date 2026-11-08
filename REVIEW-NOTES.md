# Implementation review notes

## Current repository integration

The existing frontend route `app/(app)/q-sets/[qSetId].tsx` re-exports `src/features/training/screens/ChallengeScreen.tsx`. This overlay replaces that screen rather than creating a parallel route named `select_category.jsx`.

The existing q-set API returns:

- `question.content.prompt` — localized object, normally `{ ms, en }`
- `question.content.hints` — localized array object
- `question.media` — media rows with authenticated API URLs
- `content.submodule.name` — localized activity/category name

The new `getPrompt()` helper reads the current question's localized `prompt` field using the same language fallback policy as `localize()`.

## Microphone data flow

1. User presses microphone; `AudioModule.requestRecordingPermissionsAsync()` requests permission.
2. `expo-audio` records using `RecordingPresets.HIGH_QUALITY`.
3. User presses the microphone again; the recorder stops and returns a URI.
4. `speechApi.ts` creates multipart form data and sends it to `/api/v1/speech/transcribe` with the existing bearer-token header.
5. Web uploads a WebM Blob with the MIME type normalized to `audio/webm` (browsers can otherwise include codec parameters); iOS / Android upload an M4A file descriptor.
6. A non-empty `TRANSCRIBED` result is appended to the answer input; `NO_INPUT` and request failures remain visible as non-fatal UI messages.

The backend already supports `.webm` (`audio/webm`) and `.m4a` (`audio/mp4`) in `speechRoutes.ts`. The backend removes the temporary upload in `speechController.ts` after the transcription request.

## Intentionally not implemented

- Live points balance: no patient balance API was found in the current branch. `rewardPoolPoints` is a q-set reward-pool value, not the user's accumulated balance.
- Countdown: no configured timer/session duration was found. Showing a hard-coded `97 seconds` would be misleading and could add unnecessary time pressure to aphasia therapy.
- XP awarding, correctness feedback, attempt submission, or progression: the current transcription endpoint returns a transcript, and the evaluation endpoint is a prototype lexical comparison. Neither provides an approved persisted attempt/score contract for this UI.
- Hint point deduction: no hint cost policy or points balance mutation endpoint exists.

## Verification status

This overlay was generated against the repository's `main` branch and the Expo SDK 57 documentation. The repository was inspected remotely; no local clone, installed Expo dependencies, native device, local PostgreSQL service, or Whisper model was available in this build session. Run the checklist in `README-MERGE-OVERLAY.md` before committing.

# MDATE Training Module Refactor Overlay

This overlay refactors the Expo training-content screens into feature-based screens and reusable components. Extract it at the repository root.

## Route mapping

The specification's three-screen experience maps to the existing MDATE published-content model:

| User experience | MDATE entity / API |
|---|---|
| Module selector carousel | `ModuleSummary` from `GET /api/v1/modules` |
| Activity selector carousel | `SubmoduleSummary` from `GET /api/v1/modules/:moduleId` |
| Practice-set selection within the activity screen | `QSetSummary` from `GET /api/v1/submodules/:submoduleId/q-sets` |
| Interactive challenge | `QSetDetails` from `GET /api/v1/q-sets/:qSetId` |

The `Q_Set` selector is intentionally embedded in the Activity Selector screen. An activity may have multiple practice sets; silently choosing the first set would be incorrect.

## Files added

- `src/expo-test/src/features/training/components/TrainingHeader.tsx`
- `src/expo-test/src/features/training/components/TrainingStateCard.tsx`
- `src/expo-test/src/features/training/screens/ModuleSelectorScreen.tsx`
- `src/expo-test/src/features/training/screens/ActivitySelectorScreen.tsx`
- `src/expo-test/src/features/training/screens/ChallengeScreen.tsx`

## Files replaced with route adapters

- `src/expo-test/app/(app)/(main)/modules.tsx`
- `src/expo-test/app/(app)/modules/[moduleId].tsx`
- `src/expo-test/app/(app)/q-sets/[qSetId].tsx`

The existing Expo Router paths remain the same. The current `app/(app)/_layout.tsx` already registers these routes, so no layout change is required. The old `/submodules/[submoduleId]` route is left untouched for compatibility with previous navigation.

## Existing boundaries retained

- Uses the current authenticated `useAuth()` context and existing read-only `trainingApi.ts`.
- Uses published module, submodule, Q_Set, question and media records from the API.
- Keeps the `EN` / `MS` toggle local to each screen.
- The challenge progress indicator represents question position within the current practice set. It does not claim that a response was assessed.
- Keyboard input remains local to the screen. The repository currently has no text-attempt submission endpoint in this read-only training-content API.
- Speech input and text-to-speech controls explicitly remain unavailable until those integrations are connected.
- No hard-coded coin balance, fake XP, correctness result, or fabricated answer submission is introduced. The MDATE design keeps speech confidence, therapeutic performance and downstream rewards separate.

## Merge and verification

1. Back up your working tree.
2. Extract the ZIP at the repository root, preserving the paths.
3. From PowerShell:

```powershell
cd src/expo-test
npx tsc --noEmit
npx expo start --web --port 8081 --clear
```

4. Test the following path:
   - Dashboard → Modules
   - Use previous/next to change the selected module
   - Choose a module
   - Use previous/next to browse exercise types
   - Select a practice set
   - Browse questions and hints
   - Switch EN / MS
   - Return to the activity selector

This archive does not modify Express or PostgreSQL. It relies on the current published training-content endpoints and database.

Full typechecking, API integration testing and native-device testing must be run in the user's project environment after merging.

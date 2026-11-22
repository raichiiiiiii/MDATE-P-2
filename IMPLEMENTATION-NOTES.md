# MDATE Loop 1 — Shared UI Foundation

Overlay paths are relative to the repository root. Merge this ZIP at the root of `MDATE-P-2`.

## Included

- `src/expo-test/src/shared/theme/tokens.ts` — shared colour, spacing, radius, typography, and viewport tokens.
- `src/expo-test/src/shared/theme/PatientPreferencesContext.tsx` — one account-backed preference context for locale, accessibility, voice preferences, and the active normal/high-contrast palette.
- `src/expo-test/src/shared/ui/native.tsx` — shared Poppins `Text` / `TextInput` wrappers now apply the saved text-size and high-contrast settings. The text floor is 16px.
- `src/expo-test/src/components/AppViewport.tsx` — removes the fixed 412 × 892 frame and aspect ratio; web layout uses a fluid `100dvh` height and 430px maximum width.
- `src/expo-test/app/_layout.tsx` — mounts the preference provider from the authenticated account.

## Integration note

Screens that import `Text` or `TextInput` directly from `react-native` do not yet consume the shared preference-aware wrappers. Migrate those imports screen-by-screen in the subsequent UI loops. This loop establishes the global context and reusable primitives without mixing in dashboard or training-screen redesigns.

No backend endpoint, database schema, environment variable, dependency, or lockfile change is included.

## Verification

This overlay was checked for path consistency and obvious import/structure mistakes. A full Expo TypeScript/build run requires installing the repository's dependencies; the current execution environment could not clone the repository or install npm packages because external network DNS was unavailable. Run the project's normal typecheck/build after merging.

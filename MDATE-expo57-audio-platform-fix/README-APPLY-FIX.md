# MDATE Expo SDK 57 Audio / Platform.OS Fix

## Root cause found

The `ChallengeScreen` recorder initialization:

```ts
const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
```

is the documented Expo Audio API. The repository manifest, however, mixes Expo SDK 57 (`expo@^57.0.30`) with `expo-image-picker@^58.0.10`, which belongs to SDK 58. Mixed Expo module majors can produce an inconsistent native-module / platform dependency graph.

This overlay aligns the Expo packages with SDK 57:

- `expo-audio`: `~57.0.5`
- `expo-image-picker`: `~57.0.21`
- `expo-speech`: `~57.0.3`

It keeps the existing Expo / React Native versions and other dependency declarations from the repository. It does not change `ChallengeScreen.tsx`, because the recorder hook call matches the official SDK 57 example.

## Merge

Extract this ZIP at the repository root, replacing:

`src/expo-test/package.json`

Then open PowerShell in `src\expo-test` and run:

```powershell
npm install
npx expo install --fix
npx expo-doctor
```

Check that the dependency tree resolves to one compatible set:

```powershell
npm ls expo react-native expo-modules-core expo-audio expo-image-picker expo-speech
```

Then restart Metro with a clean cache:

```powershell
npx expo start --clear
```

Do not manually install a newer `expo-audio` major or add `expo-modules-core` as a direct dependency. Expo manages the compatible modules-core version through its SDK dependencies.

## Expected SDK 57 package versions

| Package | Expected range |
|---|---:|
| expo | existing `^57.0.30` |
| react-native | existing `0.86.3` |
| expo-audio | `~57.0.5` |
| expo-image-picker | `~57.0.21` |
| expo-speech | `~57.0.3` |

The `npm install` step regenerates `package-lock.json` from the corrected manifest. Commit the updated package and lock files together.

## If the error remains

Run the following and share the complete output:

```powershell
npx expo-doctor
npm ls expo react-native expo-modules-core expo-audio expo-image-picker expo-speech
```

That will show whether Metro is still resolving duplicate or incompatible Expo module versions.

For a custom development build (not Expo Go), rebuild the development client after changing native package versions or config plugins.

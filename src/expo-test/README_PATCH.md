MDATE Expo app routes patch

Purpose
-------
The route files under app/(app) were empty. When authentication reached phase "ready", Expo Router attempted to render one of those empty route modules and threw the WrappedScreenComponent / undefined element error.

Install
-------
1. Stop Expo (Ctrl+C).
2. Back up your project.
3. Extract this archive directly into the expo-test project root, merging the app folder and replacing matching files.
4. Run: npx tsc --noEmit
5. Run: npx expo start --web --port 8081 --clear
6. Sign in again.

Files included
--------------
app/(app)/_layout.tsx
app/(app)/(tabs)/_layout.tsx
app/(app)/(tabs)/dashboard.tsx
app/(app)/(tabs)/modules.tsx
app/(app)/(tabs)/progress.tsx
app/(app)/(tabs)/setting.tsx
app/(app)/modules/[moduleId].tsx

Important
---------
These are functional route/layout placeholders so the app can render after authentication. Training data, progress reporting, settings persistence and module exercise content are not connected to backend APIs by this patch. The patch does not modify Auth0, app/_layout.tsx, package.json, app.json, .env, or AppViewport.

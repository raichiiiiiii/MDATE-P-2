# MDATE overlay — TypeScript route-parameter fix

This ZIP is structured to extract at the **MDATE-P-2 repository root**. It replaces one file:

`src/express-test/src/main/http/controllers/trainingContentController.ts`

## Why this file changed

The current `main` branch's `npm run build` error reports that Express route parameters may be `string | string[]`, while the UUID validator and training service expect a single string. The replacement narrows each parameter to a single string before validation and use. Existing endpoint behavior and response shapes are otherwise preserved.

## Apply and verify

1. Make a backup or commit your current work.
2. Extract this ZIP into the repository root and allow the file to merge/overwrite.
3. In a terminal, run:

   ```powershell
   cd src/express-test
   npm run build
   ```

4. If the build succeeds, restart the backend (`npm start`, or use `npm run dev` while developing).
5. Retry the Modules screen with a valid Auth0 user access token.

This is a source overlay, not a full repository archive. The current GitHub `main` branch already contains the speech route, controller, Whisper worker, Python worker script, and speech requirements; they are not duplicated here. I have not run the build against your local checkout, so verify it after applying.

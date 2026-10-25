# MDATE training content slice — local setup

This overlay adds the first published-content flow while preserving the existing account/auth implementation:

1. A PostgreSQL migration creates the training hierarchy and seeds one published module.
2. Authenticated read-only Express endpoints expose modules, exercise types, Q_Sets, questions, and associated local media.
3. Expo displays a backend-driven module list, exercise selector, practice-set list, and first activity screen.

## 1. Apply the database migration

Start your existing SQL-only PostgreSQL Compose service. From `C:\Users\User\dev\test`, apply the migration using your actual PostgreSQL container name, user, and database:

```powershell
Get-Content -Raw .\infra\postgres\migrations\003_training_content.sql | docker exec -i postgres psql -U YOUR_DB_USER -d YOUR_DB_NAME
```

Replace `YOUR_DB_USER` and `YOUR_DB_NAME` with the values from your existing `.env`. The migration requires the existing identity tables (`users`) and does not replace them. It creates one published module (`mdate-core-practice`), three exercise types, one sample Q_Set per exercise, three sample questions, and media metadata rows.

For a fresh database, this migration must be applied after the existing `infra/postgres/init` scripts. It is not automatically run by PostgreSQL's init directory for an already-created volume.

## 2. Import starter images

From `C:\Users\User\dev\test\src\express-test`:

```powershell
.\scripts\import-poc-media.ps1
```

This copies just the four images referenced by the seed from the POC `images` directory to `src/express-test/storage/media/images`. If your POC has moved, use `-PocRoot 'D:\path\to\M-DATE'`. These media files remain local and are not committed.

## 3. Start Express

Confirm `src/express-test/.env` has the existing database/Auth0 settings and add:

```dotenv
MEDIA_STORAGE_DIR=./storage/media
```

Then run:

```powershell
cd C:\Users\User\dev\test\src\express-test
npm install
npm run dev
```

The new content API requires a valid Auth0 human-user access token, just like the account API.

## 4. Start Expo

Ensure `src/expo-test/.env` has valid Auth0 settings plus these URLs:

```dotenv
EXPO_PUBLIC_API_URL_WEB=http://localhost:3000
EXPO_PUBLIC_API_URL_NATIVE=http://YOUR_PC_LAN_IP:3000
```

Use `http://localhost:3000` for a web app running on the same PC; replace `YOUR_PC_LAN_IP` with your PC's private LAN IP for a physical tablet. Add the icon dependency and reconcile the existing lockfile:

```powershell
cd C:\Users\User\dev\test\src\expo-test
npm install
npm run web
```

For Android/native development, use `npm run android` or `npm start` as appropriate. Do not use `localhost` as the API host from a physical device; it refers to the device itself.

## API

The content JSON routes require Auth0 authentication and a human-user token:

- `GET /api/v1/modules`
- `GET /api/v1/modules/:moduleId`
- `GET /api/v1/submodules/:submoduleId/q-sets`
- `GET /api/v1/q-sets/:qSetId`

`GET /api/v1/media/:assetId` is intentionally a public, read-only endpoint for generic media linked to active questions in published module versions. This lets native and web image elements load media without custom authorization headers. Never store patient audio, exports, or any other private data through this endpoint. Patient recordings will require a separate authorized upload/download flow. The activity screen currently previews questions and hints; submission, therapeutic assessment, speech recording, XP awards, and progress persistence are deliberately not implemented in this slice.

## First check

After the app is running and signed in, open Training, select `MDATE Core Practice`, then open each exercise type and its Set 1. The car, reading, and book-pair images should load if the POC image import succeeded.

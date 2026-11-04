# MDATE training content setup — local JWT authentication

This guide adds the first published-content flow while using MDATE's first-party Express identity service:

1. A PostgreSQL migration creates the training hierarchy and seeds one published module.
2. Authenticated Express endpoints expose modules, exercise types, Q_Sets, questions, and associated local media.
3. Expo displays the backend-driven module list, exercise selector, practice-set list, and first activity screen.

## 1. Apply the training migration

Start the SQL-only PostgreSQL Docker service. From the repository root:

```powershell
Get-Content -Raw .\infra\postgres\migrations\003_training_content.sql | docker exec -i postgres psql -U YOUR_DB_USER -d YOUR_DB_NAME
```

Replace the user and database with the values in your existing `.env`. This migration depends on `users` and the local identity migration. For an existing database, apply `004_local_identity.sql` first; then apply `003_training_content.sql` only if it has not already been applied. Do not recreate the PostgreSQL volume.

## 2. Import starter images

From `src/express-test`:

```powershell
.\scripts\import-poc-media.ps1
```

The script copies the four seed images into `storage/media/images`. These media files remain local.

## 3. Start Express

Ensure `src/express-test/.env` contains `DATABASE_URL`, `JWT_ACCESS_SECRET`, and the other settings in `.env.example`, plus:

```dotenv
MEDIA_STORAGE_DIR=./storage/media
```

Then run:

```powershell
cd src/express-test
npm install
npm run dev
```

Authenticate through `POST /api/v1/auth/login` or `/register`. The returned MDATE access token is attached to protected training requests as `Authorization: Bearer <token>`.

## 4. Start Expo

Copy `src/expo-test/.env.example` to `.env` and set:

```dotenv
EXPO_PUBLIC_API_URL_WEB=http://localhost:3000
EXPO_PUBLIC_API_URL_NATIVE=http://YOUR_PC_LAN_IP:3000
```

For a physical tablet, use the PC's private LAN address. Then:

```powershell
cd src/expo-test
npx expo install expo-secure-store
npm install
npx expo start --web --port 8081 --clear
```

## API

The following content routes require a valid MDATE access token and an active account:

- `GET /api/v1/modules`
- `GET /api/v1/modules/:moduleId`
- `GET /api/v1/submodules/:submoduleId/q-sets`
- `GET /api/v1/q-sets/:qSetId`

`GET /api/v1/media/:assetId` is intentionally a public, read-only endpoint for generic media linked to active questions in published module versions. Patient recordings and other private assets must use a separately authorized upload/download flow.

The activity screen currently previews questions and hints. Submission, therapeutic assessment, speech recording, XP awards, and progress persistence are deliberately not implemented in this slice.

## First check

After signing in, open Training, select `MDATE Core Practice`, then open each exercise type and its Set 1. The car, reading, and book-pair images should load if the POC image import succeeded.

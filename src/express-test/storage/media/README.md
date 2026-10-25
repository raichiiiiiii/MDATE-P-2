# Local media storage

This folder is for local development media served through the authenticated Express API. Files are intentionally ignored by Git; only this README and `.gitkeep` placeholders are tracked.

From `C:\Users\User\dev\test\src\express-test`, import the small set of images used by the starter seed:

```powershell
.\scripts\import-poc-media.ps1
```

The script copies the following files from `C:\Users\User\Downloads\M-DATE\M-DATE\images` into `storage\media\images`:

- `kereta.jpg`
- `action-membaca.jpg`
- `bookbw.png`
- `bookclr.png`

The SQL seed stores only relative keys such as `images/kereta.jpg`. Do not put patient recordings, model weights, `.env` files, or personal data in this publicly source-controlled project. The media endpoint only serves files linked to active questions in a published module.

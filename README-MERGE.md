# MDATE speech integration — local JWT authentication

This speech integration belongs to `src/express-test` and uses the first-party MDATE JWT middleware. It does not depend on Auth0.

## What it adds

- `POST /api/v1/speech/transcribe`, protected by local JWT authentication and an active MDATE account.
- `POST /api/v1/speech/evaluate`, a prototype lexical comparison separated from model inference. It does **not** calculate a therapeutic score or award XP.
- `GET /api/v1/speech/health`, which reports worker state without loading the model.
- A persistent Python/Hugging Face Transformers worker started by Express; no second Flask server.
- Upload limits, file-type checks, speech-worker error mapping, and worker shutdown cleanup.

## After merging

From `src/express-test`:

```powershell
npm install
python -m pip install -r requirements-speech.txt
npm run typecheck
npm run dev
```

Install FFmpeg and make sure `ffmpeg` is available on `PATH`. Install a CPU-compatible PyTorch wheel for your Python version/OS if the normal `torch` installation does not work.

Copy the compatible fine-tuned Whisper checkpoint to `src/express-test/models/whisper-aphasia/`. It must include `config.json`, model weights, processor/tokenizer files, and feature-extractor configuration. This integration uses local model files only.

Configure the local identity variables from `src/express-test/.env.example`, especially `DATABASE_URL` and `JWT_ACCESS_SECRET`. The access token must be obtained through MDATE's `/api/v1/auth/login` or `/register` endpoints.

## API

### Health/state

`GET http://localhost:3000/api/v1/speech/health`

### Transcribe audio

`POST http://localhost:3000/api/v1/speech/transcribe`

Requires an MDATE access token. Send multipart form data with one `audio` file (WAV, MP3, M4A, OGG, WebM or MP4, maximum 15 MB), and optional `language` (`ms` or `en`).

```bash
curl -X POST http://localhost:3000/api/v1/speech/transcribe \
  -H "Authorization: Bearer YOUR_MDATE_ACCESS_TOKEN" \
  -F "audio=@sample.wav;type=audio/wav" \
  -F "language=ms"
```

### Prototype answer comparison

`POST /api/v1/speech/evaluate`

```json
{
  "answer": "kucing",
  "target": "kucing",
  "language": "ms"
}
```

This reports `EXACT_MATCH`, `PARTIAL_MATCH`, or `NO_MATCH`. It is a prototype whole-word comparison, not clinical/therapeutic scoring. Keep inference signals separate from assessment, adaptation and XP decisions.

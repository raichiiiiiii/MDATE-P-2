# MDATE speech-integration overlay

This ZIP is laid out relative to the **repository root**. Extract/merge it at the root of `MDATE-P-2`; the paths beginning `src/express-test/` will land in the existing Express project. It does not contain the fine-tuned model weights.

## What it adds

- Auth-protected `POST /api/v1/speech/transcribe` using the existing Auth0 and human-user middleware.
- `POST /api/v1/speech/evaluate`, a prototype lexical comparison separated from model inference. It deliberately does **not** calculate a therapeutic score or award XP.
- `GET /api/v1/speech/health`, which reports the local worker's state without loading the model.
- A persistent Python/Hugging Face Transformers worker started by the existing Express process; no second Flask server and no PWA/static serving.
- Upload limits, file-type checks, speech-worker error mapping, and worker shutdown cleanup.

## After merging

Run these commands from the repository root:

```powershell
cd src/express-test
npm install
python -m pip install -r requirements-speech.txt
```

`npm install` updates the existing `package-lock.json` for the new `multer` dependency. The ZIP intentionally does not include a stale lockfile.

Install FFmpeg and make sure `ffmpeg` is available on `PATH`. Install a CPU-compatible PyTorch wheel for your Python version/OS if the normal `torch` installation does not work. The first model load can be slow on CPU.

Copy the complete fine-tuned Whisper checkpoint to `src/express-test/models/whisper-aphasia/`. It must be compatible with Hugging Face Transformers and include `config.json`, model weights, processor/tokenizer files, and feature-extractor configuration. This integration uses local model files only; it does not download a fallback model.

Configure `src/express-test/.env` (based on `.env.example`) with the existing required database/Auth0 values. If Python is not found automatically, set `PYTHON_EXECUTABLE` to its absolute executable path, for example `C:/Python312/python.exe`. Set `MDATE_WHISPER_MODEL_DIR` if your model is stored elsewhere. Paths are resolved from the `src/express-test` working directory when relative.

Then run:

```powershell
npm run typecheck
npm run dev
```

## API

### Health/state

`GET http://localhost:3000/api/v1/speech/health`

The worker is started lazily on the first valid transcription request. Health may therefore report `not_started` before that request, and `starting` while the model loads.

### Transcribe audio

`POST http://localhost:3000/api/v1/speech/transcribe`

Requires the same bearer token and human-user identity as the other account/content endpoints. Send `multipart/form-data` with:

- `audio`: one WAV, MP3, M4A, OGG, WebM, or MP4 file (maximum 15 MB)
- `language`: optional `ms` or `en` (defaults to `ms`)

Example with `curl`:

```bash
curl -X POST http://localhost:3000/api/v1/speech/transcribe \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "audio=@sample.wav;type=audio/wav" \
  -F "language=ms"
```

A response reports the transcript, language, duration, model, and `TRANSCRIBED` or `NO_INPUT` status. A short utterance below 500 ms is treated as `NO_INPUT` and has no score.

### Prototype answer comparison

`POST http://localhost:3000/api/v1/speech/evaluate`

JSON body:

```json
{
  "answer": "kucing",
  "target": "kucing",
  "language": "ms"
}
```

This reports `EXACT_MATCH`, `PARTIAL_MATCH`, or `NO_MATCH`. It is only a simple whole-word prototype comparison, not clinical/therapeutic scoring. Replace this rule with the configured MDATE assessment rules before using it for patient progression or XP.

## Architecture notes

The Express process owns one persistent Python child process, and the worker serializes transcription requests against one CPU-loaded model instance. Model inference only returns transcription signals; it does not access the database, decide progression, or award XP. Uploads are written to the operating system's temporary directory, passed to the local Python worker by path, and deleted by Express after processing. The overlay does not persist patient recordings as MDATE media assets.

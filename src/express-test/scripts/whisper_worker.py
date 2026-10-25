#!/usr/bin/env python3
"""Persistent local Whisper worker. stdout is reserved for JSON-lines messages."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import traceback
from pathlib import Path
from typing import Any

import numpy as np
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

MODEL_NAME = "whisper-aphasia"
MODEL_DIRECTORY = Path(
    os.environ.get("MDATE_WHISPER_MODEL_DIR", str(Path.cwd() / "models" / MODEL_NAME))
).expanduser().resolve()
SAMPLE_RATE = 16_000
MIN_UTTERANCE_SECONDS = 0.5
FFMPEG_TIMEOUT_SECONDS = 60
LANGUAGE_NAMES = {"ms": "malay", "en": "english"}


def emit(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def log(message: str) -> None:
    print(f"[MDATE speech worker] {message}", file=sys.stderr, flush=True)


def decode_audio(audio_path: str) -> np.ndarray:
    """Decode a temporary uploaded file to mono, 16-kHz float samples."""
    input_path = Path(audio_path).expanduser().resolve()
    if not input_path.is_file() or input_path.stat().st_size == 0:
        raise ValueError("The uploaded audio file is missing or empty.")

    command = [
        "ffmpeg",
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(input_path),
        "-f",
        "s16le",
        "-acodec",
        "pcm_s16le",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        "pipe:1",
    ]
    try:
        completed = subprocess.run(
            command,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=FFMPEG_TIMEOUT_SECONDS,
            check=False,
        )
    except FileNotFoundError as error:
        raise RuntimeError(
            "FFmpeg is not installed or is not available on PATH."
        ) from error
    except subprocess.TimeoutExpired as error:
        raise ValueError("Audio decoding timed out.") from error

    if completed.returncode != 0 or not completed.stdout:
        detail = completed.stderr.decode("utf-8", errors="replace").strip()
        log(f"FFmpeg could not decode the upload: {detail[:500]}")
        raise ValueError("The audio file could not be decoded. Try a WAV, MP3, M4A, OGG, WebM, or MP4 file.")

    pcm = np.frombuffer(completed.stdout, dtype="<i2")
    if pcm.size == 0:
        raise ValueError("The uploaded audio contains no samples.")

    return pcm.astype(np.float32) / 32768.0


def load_model():
    if not MODEL_DIRECTORY.is_dir():
        raise FileNotFoundError(
            f"The local model directory does not exist: {MODEL_DIRECTORY}"
        )

    if not (MODEL_DIRECTORY / "config.json").is_file():
        raise FileNotFoundError(
            f"No config.json was found in the local model directory: {MODEL_DIRECTORY}"
        )

    # Explicit local_files_only prevents an accidental download or fallback to
    # a public base model. The selected fine-tuned checkpoint must be complete.
    processor = AutoProcessor.from_pretrained(
        str(MODEL_DIRECTORY), local_files_only=True
    )
    model = AutoModelForSpeechSeq2Seq.from_pretrained(
        str(MODEL_DIRECTORY), local_files_only=True
    )
    model.eval()

    return pipeline(
        task="automatic-speech-recognition",
        model=model,
        tokenizer=processor.tokenizer,
        feature_extractor=processor.feature_extractor,
        device=-1,  # CPU-only to match the project's current development hardware.
    )


def handle_request(asr, request: dict[str, Any]) -> None:
    request_id = request.get("id")
    try:
        audio_path = request.get("audioPath")
        language_code = request.get("language", "ms")
        if not isinstance(request_id, str) or not request_id:
            raise ValueError("The request is missing an identifier.")
        if not isinstance(audio_path, str) or not audio_path:
            raise ValueError("The request is missing its temporary audio path.")
        if language_code not in LANGUAGE_NAMES:
            raise ValueError("Language must be Malay (ms) or English (en).")

        samples = decode_audio(audio_path)
        duration_seconds = float(samples.size / SAMPLE_RATE)

        if duration_seconds < MIN_UTTERANCE_SECONDS:
            emit(
                {
                    "type": "result",
                    "id": request_id,
                    "status": "NO_INPUT",
                    "transcript": "",
                    "durationSeconds": round(duration_seconds, 3),
                    "model": MODEL_NAME,
                }
            )
            return

        result = asr(
            {"raw": samples, "sampling_rate": SAMPLE_RATE},
            generate_kwargs={
                "language": LANGUAGE_NAMES[language_code],
                "task": "transcribe",
            },
        )
        transcript = str(result.get("text", "")).strip()
        status = "TRANSCRIBED" if transcript else "NO_INPUT"

        emit(
            {
                "type": "result",
                "id": request_id,
                "status": status,
                "transcript": transcript,
                "durationSeconds": round(duration_seconds, 3),
                "model": MODEL_NAME,
            }
        )
    except ValueError as error:
        emit(
            {
                "type": "error",
                "id": request_id,
                "code": "INVALID_AUDIO",
                "message": str(error),
            }
        )
    except Exception:
        log("Transcription failed:\n" + traceback.format_exc())
        emit(
            {
                "type": "error",
                "id": request_id,
                "code": "TRANSCRIPTION_FAILED",
                "message": "Speech transcription failed. Check the server logs and model compatibility.",
            }
        )


def main() -> int:
    try:
        log(f"Loading local model from {MODEL_DIRECTORY}")
        asr = load_model()
        emit({"type": "ready", "model": MODEL_NAME})
        log("Model loaded; waiting for transcription requests.")
    except Exception as error:
        log("Model startup failed:\n" + traceback.format_exc())
        emit(
            {
                "type": "startup_error",
                "message": f"Could not load the local Whisper model: {error}",
            }
        )
        return 1

    for line in sys.stdin:
        request: dict[str, Any] = {}
        try:
            parsed = json.loads(line)
            if not isinstance(parsed, dict):
                raise ValueError("Request must be a JSON object.")
            request = parsed
        except (json.JSONDecodeError, ValueError) as error:
            emit(
                {
                    "type": "error",
                    "id": request.get("id"),
                    "code": "INVALID_REQUEST",
                    "message": f"Invalid worker request: {error}",
                }
            )
            continue

        handle_request(asr, request)

    log("Input stream closed; worker exiting.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

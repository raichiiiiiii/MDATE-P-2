# Local fine-tuned Whisper model

Place the complete Hugging Face Transformers-compatible fine-tuned model in this directory.

At minimum, the directory should contain `config.json`, model weights, processor/tokenizer
files, and the feature-extractor configuration required by the fine-tuned checkpoint. Keep
large model weight files out of Git and out of the overlay ZIP.

The worker uses local files only. It will not download `openai/whisper-small` or fall back to
a different model if this directory is missing or incomplete.

To use a model stored elsewhere, configure `MDATE_WHISPER_MODEL_DIR` in the Express process
environment. The path may be absolute or relative to `src/express-test`.

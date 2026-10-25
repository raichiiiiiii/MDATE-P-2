import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";
import { createInterface, type Interface } from "node:readline";

export type SpeechLanguageCode = "ms" | "en";
export type TranscriptionStatus = "TRANSCRIBED" | "NO_INPUT";

export interface TranscriptionResult {
  transcript: string;
  status: TranscriptionStatus;
  durationSeconds: number;
  model: string;
}

export class SpeechWorkerError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: 400 | 422 | 503
  ) {
    super(message);
    this.name = "SpeechWorkerError";
  }
}

type WorkerMessage =
  | { type: "ready"; model?: string }
  | {
      type: "result";
      id: string;
      transcript: string;
      status: TranscriptionStatus;
      durationSeconds: number;
      model: string;
    }
  | { type: "error"; id?: string; code?: string; message: string }
  | { type: "startup_error"; message: string };

type WorkerState = "not_started" | "starting" | "ready" | "failed" | "stopped";

type PendingRequest = {
  resolve: (result: TranscriptionResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

function positiveIntegerFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Owns one persistent CPU-only Python/Transformers process. Requests are
 * serialized because a single Whisper model instance processes one utterance
 * at a time on the project's low-resource development hardware.
 */
export class WhisperWorker {
  private child: ChildProcessWithoutNullStreams | null = null;
  private lineReader: Interface | null = null;
  private startPromise: Promise<void> | null = null;
  private stateValue: WorkerState = "not_started";
  private lastErrorValue: string | null = null;
  private modelValue = "whisper-aphasia";
  private readonly pending = new Map<string, PendingRequest>();
  private requestQueue: Promise<void> = Promise.resolve();

  get status(): {
    state: WorkerState;
    ready: boolean;
    model: string;
    error: string | null;
  } {
    return {
      state: this.stateValue,
      ready: this.stateValue === "ready",
      model: this.modelValue,
      error: this.lastErrorValue,
    };
  }

  transcribe(audioPath: string, language: SpeechLanguageCode): Promise<TranscriptionResult> {
    const task = this.requestQueue.then(async () => {
      await this.start();
      return this.sendTranscription(audioPath, language);
    });

    // A failed request must not permanently poison the queue.
    this.requestQueue = task.then(
      () => undefined,
      () => undefined
    );

    return task;
  }

  private start(): Promise<void> {
    if (this.stateValue === "ready") return Promise.resolve();
    if (this.startPromise) return this.startPromise;

    this.stateValue = "starting";
    this.lastErrorValue = null;

    this.startPromise = new Promise<void>((resolveReady, rejectReady) => {
      let settled = false;
      let startupError: Error | null = null;
      let startupTimer: ReturnType<typeof setTimeout> | undefined;

      const settleReady = () => {
        if (settled) return;
        settled = true;
        if (startupTimer) clearTimeout(startupTimer);
        this.stateValue = "ready";
        this.lastErrorValue = null;
        resolveReady();
      };

      const settleFailure = (error: Error) => {
        if (settled) return;
        settled = true;
        if (startupTimer) clearTimeout(startupTimer);
        this.stateValue = this.stateValue === "stopped" ? "stopped" : "failed";
        this.lastErrorValue = error.message;
        rejectReady(error);
      };

      const pythonExecutable =
        process.env.PYTHON_EXECUTABLE ||
        (process.platform === "win32" ? "python" : "python3");
      const workerScript = resolve(process.cwd(), "scripts", "whisper_worker.py");
      const modelDirectory = resolve(
        process.env.MDATE_WHISPER_MODEL_DIR || "./models/whisper-aphasia"
      );

      let child: ChildProcessWithoutNullStreams;
      try {
        child = spawn(pythonExecutable, ["-u", workerScript], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            MDATE_WHISPER_MODEL_DIR: modelDirectory,
            PYTHONUNBUFFERED: "1",
          },
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error) {
        const startupFailure = toError(error);
        settleFailure(startupFailure);
        this.startPromise = null;
        return;
      }

      this.child = child;
      child.stderr.pipe(process.stderr);
      const reader = createInterface({ input: child.stdout });
      this.lineReader = reader;

      startupTimer = setTimeout(() => {
        startupError = new Error(
          "Whisper model startup timed out. Check the Python environment and local model files."
        );
        child.kill();
      }, positiveIntegerFromEnv("MDATE_SPEECH_STARTUP_TIMEOUT_MS", 300_000));

      reader.on("line", (line) => {
        let message: WorkerMessage;
        try {
          message = JSON.parse(line) as WorkerMessage;
        } catch {
          // stdout is a machine-readable JSON-lines protocol. Diagnostics belong on stderr.
          console.error("[MDATE speech] Ignoring malformed worker output.");
          return;
        }

        if (message.type === "ready") {
          if (message.model) this.modelValue = message.model;
          settleReady();
          return;
        }

        if (message.type === "startup_error") {
          startupError = new Error(message.message || "Whisper worker failed to start.");
          child.kill();
          return;
        }

        if (message.type === "error" && !message.id) {
          startupError = new Error(message.message || "Whisper worker failed to start.");
          child.kill();
          return;
        }

        if (!message.id) return;
        const pendingRequest = this.pending.get(message.id);
        if (!pendingRequest) return;

        clearTimeout(pendingRequest.timer);
        this.pending.delete(message.id);

        if (message.type === "error") {
          const code = message.code || "TRANSCRIPTION_FAILED";
          const statusCode =
            code === "INVALID_REQUEST" ? 400 : code === "INVALID_AUDIO" ? 422 : 503;
          pendingRequest.reject(
            new SpeechWorkerError(
              message.message || "Transcription failed.",
              code,
              statusCode
            )
          );
          return;
        }

        if (message.type === "result") {
          pendingRequest.resolve({
            transcript: message.transcript,
            status: message.status,
            durationSeconds: message.durationSeconds,
            model: message.model || this.modelValue,
          });
        }
      });

      child.once("error", (error) => {
        settleFailure(error);
        this.lastErrorValue = error.message;
        this.child = null;
        this.lineReader?.close();
        this.lineReader = null;
        this.startPromise = null;
      });

      child.once("exit", (code, signal) => {
        if (startupTimer) clearTimeout(startupTimer);
        reader.close();
        if (this.lineReader === reader) this.lineReader = null;

        if (!settled) {
          settleFailure(
            startupError ||
              new Error(
                `Whisper worker exited before becoming ready (code=${String(code)}, signal=${String(signal)}).`
              )
          );
        }

        const stopping = this.stateValue === "stopped";
        this.child = null;
        this.startPromise = null;
        if (!stopping) {
          this.stateValue = "failed";
          if (!this.lastErrorValue) {
            this.lastErrorValue = `Whisper worker exited (code=${String(code)}, signal=${String(signal)}).`;
          }
        }

        const exitError = new Error(this.lastErrorValue || "Whisper worker exited.");
        for (const [id, pendingRequest] of this.pending) {
          clearTimeout(pendingRequest.timer);
          this.pending.delete(id);
          pendingRequest.reject(exitError);
        }
      });
    });

    return this.startPromise;
  }

  private sendTranscription(
    audioPath: string,
    language: SpeechLanguageCode
  ): Promise<TranscriptionResult> {
    const child = this.child;
    if (!child || child.stdin.destroyed || this.stateValue !== "ready") {
      return Promise.reject(new Error("Whisper worker is not ready."));
    }

    const id = randomUUID();
    const timeoutMs = positiveIntegerFromEnv("MDATE_SPEECH_REQUEST_TIMEOUT_MS", 180_000);

    return new Promise<TranscriptionResult>((resolveResult, rejectResult) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const timeoutError = new Error(
          "Speech transcription timed out. The worker is being restarted; please retry."
        );
        this.stateValue = "failed";
        this.lastErrorValue = timeoutError.message;

        const runningChild = this.child;
        if (!runningChild || runningChild.exitCode !== null) {
          rejectResult(timeoutError);
          return;
        }

        // Do not let the next queued request start until the timed-out process exits.
        runningChild.once("exit", () => rejectResult(timeoutError));
        runningChild.kill();
      }, timeoutMs);

      this.pending.set(id, { resolve: resolveResult, reject: rejectResult, timer });

      const payload = JSON.stringify({ id, audioPath, language });

      child.stdin.write(`${payload}\n`, (error) => {
        if (!error) return;
        const pendingRequest = this.pending.get(id);
        if (!pendingRequest) return;
        clearTimeout(pendingRequest.timer);
        this.pending.delete(id);
        pendingRequest.reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    const child = this.child;
    this.stateValue = "stopped";

    if (!child) {
      this.startPromise = null;
      this.lineReader?.close();
      this.lineReader = null;
      return;
    }

    for (const [id, pendingRequest] of this.pending) {
      clearTimeout(pendingRequest.timer);
      this.pending.delete(id);
      pendingRequest.reject(new Error("Whisper worker is shutting down."));
    }

    if (child.exitCode === null) {
      const exited = new Promise<void>((resolveExit) => {
        child.once("exit", () => resolveExit());
      });
      child.kill();

      let hardKillTimer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        exited,
        new Promise<void>((resolveTimeout) => {
          hardKillTimer = setTimeout(resolveTimeout, 2_000);
        }),
      ]);
      if (hardKillTimer) clearTimeout(hardKillTimer);
      if (child.exitCode === null) child.kill("SIGKILL");
    }

    this.child = null;
    this.startPromise = null;
    this.lineReader?.close();
    this.lineReader = null;
  }
}

export const whisperWorker = new WhisperWorker();

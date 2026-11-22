import { Platform } from "react-native";
import type { ApiHeadersFactory } from "../auth/accountApi";
import { getTrainingApiBaseUrl, type Language } from "./trainingApi";

export type SpeechHealthResponse = {
  feature: string;
  status: "not_started" | "starting" | "ready" | "failed" | "stopped";
  ready: boolean;
  model: string;
  error?: string;
  detail?: string;
  note?: string;
};

export async function getSpeechHealth(getAuthHeaders?: ApiHeadersFactory): Promise<SpeechHealthResponse> {
  const url = `${getTrainingApiBaseUrl()}/api/v1/speech/health`;
  const headers = getAuthHeaders ? await getAuthHeaders(url, "GET") : {};
  const response = await fetch(url, { headers: { Accept: "application/json", ...headers } });
  if (!response.ok) throw new Error(`Speech health check failed (${response.status})`);
  return response.json();
}

export async function warmupSpeechModel(getAuthHeaders: ApiHeadersFactory): Promise<SpeechHealthResponse> {
  const url = `${getTrainingApiBaseUrl()}/api/v1/speech/warmup`;
  const authHeaders = await getAuthHeaders(url, "POST");
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Failed to warm up speech model (${response.status})`);
  }
  return data as SpeechHealthResponse;
}

type TranscriptionResponse = {
  status: "TRANSCRIBED" | "NO_INPUT";
  transcript: string;
  language: Language;
  durationSeconds: number;
  model: string;
};

/**
 * Sends an Expo Audio recording to MDATE's authenticated Whisper endpoint.
 * The browser records WebM; native Expo Audio records M4A using the high-quality preset.
 */
export async function transcribeRecording(
  recordingUri: string,
  language: Language,
  getAuthHeaders: ApiHeadersFactory,
): Promise<TranscriptionResponse> {
  if (!recordingUri.trim()) throw new Error("The recording URI is missing.");

  const url = `${getTrainingApiBaseUrl()}/api/v1/speech/transcribe`;
  const authHeaders = await getAuthHeaders(url, "POST");
  const form = new FormData();
  form.append("language", language);

  if (Platform.OS === "web") {
    const fileResponse = await fetch(recordingUri);
    if (!fileResponse.ok) throw new Error("The browser recording could not be read.");
    const audioBlob = await fileResponse.blob();
    if (audioBlob.size === 0) throw new Error("The browser returned an empty recording.");
    // Browsers may append codec parameters (for example, audio/webm;codecs=opus).
    // The API currently whitelists the base audio/webm MIME type.
    const normalizedBlob = new Blob([audioBlob], { type: "audio/webm" });
    form.append("audio", normalizedBlob, "mdate-answer.webm");
  } else {
    form.append("audio", {
      uri: recordingUri,
      name: "mdate-answer.m4a",
      type: "audio/mp4",
    } as unknown as Blob);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders },
    body: form,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = typeof payload === "object" && payload !== null
      ? payload as Record<string, unknown>
      : {};
    throw new Error(
      typeof record.message === "string"
        ? record.message
        : `Speech transcription failed (HTTP ${response.status}).`,
    );
  }
  if (typeof payload !== "object" || payload === null) {
    throw new Error("The speech service returned an invalid response.");
  }

  const record = payload as Record<string, unknown>;
  if (
    (record.status !== "TRANSCRIBED" && record.status !== "NO_INPUT") ||
    typeof record.transcript !== "string"
  ) {
    throw new Error("The speech service returned an invalid transcription result.");
  }

  return {
    status: record.status,
    transcript: record.transcript,
    language: record.language === "ms" ? "ms" : "en",
    durationSeconds: typeof record.durationSeconds === "number" ? record.durationSeconds : 0,
    model: typeof record.model === "string" ? record.model : "unknown",
  };
}

export type EvaluationResponse = {
  match: "EXACT_MATCH" | "PARTIAL_MATCH" | "NO_MATCH";
  correct: boolean;
  language: Language;
  scoring: string;
};

/**
 * Milestone 1 prototype speech/text answer evaluation against MDATE API.
 * This is lexical demonstration comparison only; not clinical scoring.
 */
export async function evaluateAnswer(
  answer: string,
  target: string,
  language: Language,
  getAuthHeaders: ApiHeadersFactory,
): Promise<EvaluationResponse> {
  const url = `${getTrainingApiBaseUrl()}/api/v1/speech/evaluate`;
  const authHeaders = await getAuthHeaders(url, "POST");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      answer: answer.trim(),
      target: target.trim(),
      language,
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = typeof payload === "object" && payload !== null
      ? payload as Record<string, unknown>
      : {};
    throw new Error(
      typeof record.message === "string"
        ? record.message
        : `Answer evaluation failed (HTTP ${response.status}).`,
    );
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("The evaluation service returned an invalid response.");
  }

  const record = payload as Record<string, unknown>;
  return {
    match: record.match as EvaluationResponse["match"],
    correct: Boolean(record.correct),
    language: record.language === "ms" ? "ms" : "en",
    scoring: typeof record.scoring === "string" ? record.scoring : "prototype_lexical_match_only",
  };
}

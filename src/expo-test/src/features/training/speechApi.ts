import { Platform } from "react-native";
import type { ApiHeadersFactory } from "../auth/accountApi";
import { getTrainingApiBaseUrl, type Language } from "./trainingApi";

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

import type { ApiHeadersFactory } from "../auth/accountApi";

export type Language = "ms" | "en";
export type LocalizedText = Record<string, string>;

type ApiEnvelope<T> = { data: T };
export type ModuleSummary = {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  title: LocalizedText;
  description: LocalizedText;
  supportedLanguages: string[];
  submoduleCount: number;
};
export type SubmoduleSummary = {
  id: string;
  slug: string;
  exerciseType: "try_to_guess" | "tell_me_more" | "find_the_pair";
  name: LocalizedText;
  instructions: LocalizedText;
  iconName: string;
  position: number;
  qSetCount: number;
};
export type ModuleDetails = ModuleSummary & { submodules: SubmoduleSummary[] };
export type QSetSummary = {
  id: string;
  submoduleId: string;
  title: LocalizedText;
  difficultyIndex: number;
  position: number;
  questionCount: number;
};
export type SubmoduleQSets = {
  submodule: Omit<SubmoduleSummary, "qSetCount">;
  qSets: QSetSummary[];
};
export type QuestionMedia = {
  id: string;
  role: "prompt_image" | "outline_image" | "color_image" | "supporting_image" | "audio";
  position: number;
  mimeType: string;
  altText: LocalizedText;
  url: string;
};
export type QSetQuestion = {
  id: string;
  position: number;
  content: Record<string, unknown>;
  media: QuestionMedia[];
};
export type QSetDetails = {
  id: string;
  submoduleId: string;
  title: LocalizedText;
  difficultyIndex: number;
  position: number;
  rewardPoolPoints: number;
  submodule: Omit<SubmoduleSummary, "qSetCount" | "position">;
  questions: QSetQuestion[];
};

function getApiBaseUrl(): string {
  const baseUrl = typeof window !== "undefined"
    ? process.env.EXPO_PUBLIC_API_URL_WEB
    : process.env.EXPO_PUBLIC_API_URL_NATIVE;
  if (!baseUrl) {
    throw new Error("Missing API URL. Set EXPO_PUBLIC_API_URL_WEB and EXPO_PUBLIC_API_URL_NATIVE in your .env file.");
  }
  return baseUrl.replace(/\/+$/, "");
}

async function get<T>(path: string, getAuthHeaders: ApiHeadersFactory): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = await getAuthHeaders(url, "GET");
  const response = await fetch(url, { method: "GET", headers: { Accept: "application/json", ...headers } });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
    throw new Error(typeof record.message === "string" ? record.message : `The API returned HTTP ${response.status}.`);
  }
  const envelope = payload as ApiEnvelope<T> | null;
  if (!envelope || !("data" in envelope)) throw new Error("The API returned an invalid training-content response.");
  return envelope.data;
}

export function localize(value: unknown, language: Language): string {
  if (typeof value === "string") return value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const selected = record[language] ?? record.en ?? record.ms;
  return typeof selected === "string" ? selected : "";
}

export function localizeList(value: unknown, language: Language): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  const selected = record[language] ?? record.en ?? record.ms;
  return Array.isArray(selected) ? selected.filter((item): item is string => typeof item === "string") : [];
}

export const listModules = (headers: ApiHeadersFactory) => get<ModuleSummary[]>("/api/v1/modules", headers);
export const getModule = (id: string, headers: ApiHeadersFactory) => get<ModuleDetails>(`/api/v1/modules/${encodeURIComponent(id)}`, headers);
export const getSubmoduleQSets = (id: string, headers: ApiHeadersFactory) => get<SubmoduleQSets>(`/api/v1/submodules/${encodeURIComponent(id)}/q-sets`, headers);

export async function getQSet(id: string, headers: ApiHeadersFactory): Promise<QSetDetails> {
  const result = await get<QSetDetails>(`/api/v1/q-sets/${encodeURIComponent(id)}`, headers);
  const baseUrl = getApiBaseUrl();
  return {
    ...result,
    questions: result.questions.map((question) => ({
      ...question,
      media: question.media.map((media) => ({
        ...media,
        url: new URL(media.url, baseUrl).toString(),
      })),
    })),
  };
}

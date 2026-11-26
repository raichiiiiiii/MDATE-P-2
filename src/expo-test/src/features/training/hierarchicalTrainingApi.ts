import type { ApiRequest } from "../auth/apiClient";
import type { GameModeId, QuestionAttemptResult, RewardedQuestion } from "./core/gameTypes";
import { localize, localizeList, type Language, type QSetDetails } from "./trainingApi";

export type RewardTreeQuestion = { id: string; position: number; rewardCoins: number };
export type RewardTreeQSet = {
  id: string; title: Record<string, string>; difficulty: number; position: number;
  fibonacciWeight: number; questionCount: number; inheritedRewardCoins: number;
  questions: RewardTreeQuestion[];
};
export type RewardTreeSubmodule = {
  id: string; slug: string; gameMode: GameModeId;
  exerciseType: "try_to_guess" | "tell_me_more" | "find_the_pair";
  name: Record<string, string>; instructions: Record<string, string>; iconName: string;
  position: number; questionCount: number; inheritedRewardCoins: number; qSets: RewardTreeQSet[];
};
export type PublishedRewardTree = {
  module: { id: string; versionId: string; versionNumber: number; slug: string; title: Record<string, string>; rewardCoins: number };
  questionCount: number; allocatedCoins: number; unallocatedCoins: number; submodules: RewardTreeSubmodule[];
};
export type SubmoduleRewardResponse = { module: PublishedRewardTree["module"]; submodule: RewardTreeSubmodule; moduleQuestionCount: number };
export type RewardedTrainingSession = {
  id: string; submoduleId: string; gameMode: GameModeId; expectedQuestions: number; completedQuestions: number;
  status: "IN_PROGRESS" | "COMPLETED"; startedAt: string; completedAt: string | null;
  questions: Array<{ id: string; qSetId: string; difficulty: number; position: number; rewardCoins: number }>;
};

type Settlement = { transaction: unknown; wallet: { balance: number; lifetimeEarned: number }; duplicate: boolean };

export async function getModuleRewardTree(apiRequest: ApiRequest, moduleId: string): Promise<PublishedRewardTree> {
  const response = await apiRequest<{ data: PublishedRewardTree }>(`/api/v1/training/modules/${encodeURIComponent(moduleId)}/reward-tree`);
  return response.data;
}
export async function getSubmoduleRewardTree(apiRequest: ApiRequest, submoduleId: string): Promise<SubmoduleRewardResponse> {
  const response = await apiRequest<{ data: SubmoduleRewardResponse }>(`/api/v1/training/submodules/${encodeURIComponent(submoduleId)}/reward-tree`);
  return response.data;
}
export async function startRewardedTrainingSession(apiRequest: ApiRequest, submoduleId: string): Promise<RewardedTrainingSession> {
  const response = await apiRequest<{ session: RewardedTrainingSession }>("/api/v1/training/sessions", { method: "POST", body: { submoduleId } });
  return response.session;
}
export async function recordRewardedPairMatch(apiRequest: ApiRequest, sessionId: string, questionId: string) {
  return apiRequest<{ session: RewardedTrainingSession; rewardCoins: number; settlement?: Settlement }>(
    `/api/v1/training/sessions/${encodeURIComponent(sessionId)}/matches`, { method: "POST", body: { questionId } },
  );
}
export async function completeRewardedTrainingSession(apiRequest: ApiRequest, sessionId: string, results: QuestionAttemptResult[]) {
  // Payout values are never submitted; the server uses its immutable session snapshot.
  const serverResults = results.map(({ questionId, correct, attempts, durationMs }) => ({ questionId, correct, attempts, durationMs }));
  return apiRequest<{ session: RewardedTrainingSession; rewardCoins: number; settlement: Settlement }>(
    `/api/v1/training/sessions/${encodeURIComponent(sessionId)}/complete`, { method: "POST", body: { results: serverResults } },
  );
}

function firstMedia(qSet: QSetDetails | undefined, questionId: string, role: "outline_image" | "color_image" | "prompt_image"): string | null {
  const question = qSet?.questions.find((item) => item.id === questionId);
  return question?.media.find((media) => media.role === role)?.url ?? null;
}

export function toRewardedQuestions(
  submodule: RewardTreeSubmodule,
  qSets: QSetDetails[],
  language: Language = "en",
): RewardedQuestion[] {
  const detailsById = new Map(qSets.map((set) => [set.id, set]));
  return submodule.qSets.flatMap((rewardSet) => {
    const details = detailsById.get(rewardSet.id);
    return rewardSet.questions.map((rewardQuestion) => {
      const question = details?.questions.find((item) => item.id === rewardQuestion.id);
      const content = question?.content ?? {};
      const answers = localizeList(content.answers, language);
      const targets = localizeList(content.targetKeywords, language);
      return {
        id: rewardQuestion.id,
        qSetId: rewardSet.id,
        difficulty: rewardSet.difficulty,
        rewardCoins: rewardQuestion.rewardCoins,
        prompt: localize(content.prompt, language) || "",
        media: {
          outlineUrl: firstMedia(details, rewardQuestion.id, "outline_image"),
          colorUrl: firstMedia(details, rewardQuestion.id, "color_image"),
          promptUrl: firstMedia(details, rewardQuestion.id, "prompt_image"),
        },
        answerPayload: {
          ...content,
          answers,
          targetKeywords: targets,
          pairLabel: localize(content.pairLabel, language),
          hints: localizeList(content.hints, language),
        },
      };
    });
  });
}

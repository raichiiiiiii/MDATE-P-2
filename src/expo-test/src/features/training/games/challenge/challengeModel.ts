import type { GameEngineAdapter, QuestionAttemptResult, RewardedQuestion } from "../../core/gameTypes";

export interface ChallengeState {
  questions: RewardedQuestion[];
  currentIndex: number;
  results: Record<string, QuestionAttemptResult>;
  transcriptByQuestion: Record<string, string>;
}
export type ChallengeAction =
  | { type: "SPEECH_ANSWER_RECORDED"; result: QuestionAttemptResult; transcript: string }
  | { type: "MOVE_TO_QUESTION"; index: number }
  | { type: "RESET" };

export const challengeEngine: GameEngineAdapter<ChallengeState, ChallengeAction> = {
  modeId: "challenge",
  createInitialState: (questions) => ({ questions: [...questions], currentIndex: 0, results: {}, transcriptByQuestion: {} }),
  reduce(state, action) {
    if (action.type === "RESET") return { questions: [...state.questions], currentIndex: 0, results: {}, transcriptByQuestion: {} };
    if (action.type === "MOVE_TO_QUESTION") return { ...state, currentIndex: Math.max(0, Math.min(state.questions.length - 1, action.index)) };
    if (!state.questions.some((question) => question.id === action.result.questionId)) return state;
    if (state.results[action.result.questionId]) return state;
    return {
      ...state,
      results: { ...state.results, [action.result.questionId]: action.result },
      transcriptByQuestion: { ...state.transcriptByQuestion, [action.result.questionId]: action.transcript },
      currentIndex: Math.min(state.questions.length - 1, state.currentIndex + 1),
    };
  },
  createResultAction: (result) => ({ type: "SPEECH_ANSWER_RECORDED", result, transcript: result.responseText ?? "" }),
  isComplete: (state) => state.questions.length > 0 && state.questions.every((question) => Boolean(state.results[question.id])),
  extractResults: (state) => state.questions.flatMap((question) => state.results[question.id] ? [state.results[question.id]!] : []),
};

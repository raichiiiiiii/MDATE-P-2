import type { GameEngineAdapter, QuestionAttemptResult, RewardedQuestion } from "../../core/gameTypes";

export interface StoryTellingState {
  questions: RewardedQuestion[];
  currentIndex: number;
  narratives: Record<string, string>;
  results: Record<string, QuestionAttemptResult>;
}
export type StoryTellingAction =
  | { type: "NARRATIVE_SAVED"; questionId: string; narrative: string; result: QuestionAttemptResult }
  | { type: "SELECT_PROMPT"; index: number }
  | { type: "RESET" };

export const storyTellingEngine: GameEngineAdapter<StoryTellingState, StoryTellingAction> = {
  modeId: "story_telling",
  createInitialState: (questions) => ({ questions: [...questions], currentIndex: 0, narratives: {}, results: {} }),
  reduce(state, action) {
    if (action.type === "RESET") return { questions: [...state.questions], currentIndex: 0, narratives: {}, results: {} };
    if (action.type === "SELECT_PROMPT") return { ...state, currentIndex: Math.max(0, Math.min(state.questions.length - 1, action.index)) };
    if (!state.questions.some((question) => question.id === action.questionId) || state.results[action.questionId]) return state;
    return {
      ...state,
      narratives: { ...state.narratives, [action.questionId]: action.narrative },
      results: { ...state.results, [action.questionId]: action.result },
      currentIndex: Math.min(state.questions.length - 1, state.currentIndex + 1),
    };
  },
  createResultAction: (result) => ({ type: "NARRATIVE_SAVED", questionId: result.questionId, narrative: result.narrativeText ?? "", result }),
  isComplete: (state) => state.questions.length > 0 && state.questions.every((question) => Boolean(state.results[question.id])),
  extractResults: (state) => state.questions.flatMap((question) => state.results[question.id] ? [state.results[question.id]!] : []),
};

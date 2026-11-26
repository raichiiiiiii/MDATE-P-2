import type { GameEngineAdapter, QuestionAttemptResult, RewardedQuestion } from "../../core/gameTypes";

export interface FindThePairState {
  questions: RewardedQuestion[];
  matchedQuestionIds: string[];
  results: Record<string, QuestionAttemptResult>;
  attemptsByQuestion: Record<string, number>;
  hintedQuestionIds: string[];
}

export type FindThePairAction =
  | { type: "PAIR_MATCHED"; result: QuestionAttemptResult }
  | { type: "PAIR_ATTEMPTED"; questionId: string }
  | { type: "PAIR_HINTED"; questionId: string }
  | { type: "RESET" };

function addUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

export const findThePairEngine: GameEngineAdapter<FindThePairState, FindThePairAction> = {
  modeId: "find_the_pair",
  createInitialState: (questions) => ({
    questions: [...questions], matchedQuestionIds: [], results: {}, attemptsByQuestion: {}, hintedQuestionIds: [],
  }),
  reduce(state, action) {
    if (action.type === "RESET") return { questions: [...state.questions], matchedQuestionIds: [], results: {}, attemptsByQuestion: {}, hintedQuestionIds: [] };
    const questionId = action.type === "PAIR_HINTED" || action.type === "PAIR_ATTEMPTED" ? action.questionId : action.result.questionId;
    if (!state.questions.some((question) => question.id === questionId)) return state;
    if (action.type === "PAIR_ATTEMPTED") {
      if (state.matchedQuestionIds.includes(action.questionId)) return state;
      return { ...state, attemptsByQuestion: { ...state.attemptsByQuestion, [action.questionId]: (state.attemptsByQuestion[action.questionId] ?? 0) + 1 } };
    }
    if (action.type === "PAIR_HINTED") return { ...state, hintedQuestionIds: addUnique(state.hintedQuestionIds, action.questionId) };
    if (state.matchedQuestionIds.includes(action.result.questionId)) return state;
    return {
      ...state,
      matchedQuestionIds: addUnique(state.matchedQuestionIds, action.result.questionId),
      results: { ...state.results, [action.result.questionId]: action.result },
    };
  },
  createResultAction: (result) => ({ type: "PAIR_MATCHED", result }),
  isComplete: (state) => state.questions.length > 0 && state.questions.every((question) => state.matchedQuestionIds.includes(question.id)),
  extractResults: (state) => state.questions.flatMap((question) => state.results[question.id] ? [state.results[question.id]!] : []),
};

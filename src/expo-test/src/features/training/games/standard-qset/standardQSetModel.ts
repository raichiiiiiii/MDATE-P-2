import type { GameEngineAdapter, QuestionAttemptResult, RewardedQuestion } from "../../core/gameTypes";

export interface StandardQSetState {
  questions: RewardedQuestion[];
  activeQuestionId: string | null;
  answers: Record<string, string>;
  results: Record<string, QuestionAttemptResult>;
}
export type StandardQSetAction =
  | { type: "ANSWER_EDITED"; questionId: string; answer: string }
  | { type: "ANSWER_SUBMITTED"; result: QuestionAttemptResult }
  | { type: "OPEN_QUESTION"; questionId: string }
  | { type: "RESET" };

export const standardQSetEngine: GameEngineAdapter<StandardQSetState, StandardQSetAction> = {
  modeId: "standard_qset",
  createInitialState: (questions) => ({ questions: [...questions], activeQuestionId: questions[0]?.id ?? null, answers: {}, results: {} }),
  reduce(state, action) {
    if (action.type === "RESET") return { questions: [...state.questions], activeQuestionId: state.questions[0]?.id ?? null, answers: {}, results: {} };
    if (action.type === "ANSWER_EDITED") {
      if (!state.questions.some((question) => question.id === action.questionId) || state.results[action.questionId]) return state;
      return { ...state, activeQuestionId: action.questionId, answers: { ...state.answers, [action.questionId]: action.answer } };
    }
    if (action.type === "OPEN_QUESTION") {
      return state.questions.some((question) => question.id === action.questionId)
        ? { ...state, activeQuestionId: action.questionId }
        : state;
    }
    if (!state.questions.some((question) => question.id === action.result.questionId) || state.results[action.result.questionId]) return state;
    const next = state.questions.find((question) => !state.results[question.id] && question.id !== action.result.questionId);
    return { ...state, answers: action.result.responseText ? { ...state.answers, [action.result.questionId]: action.result.responseText } : state.answers, results: { ...state.results, [action.result.questionId]: action.result }, activeQuestionId: next?.id ?? action.result.questionId };
  },
  createResultAction: (result) => ({ type: "ANSWER_SUBMITTED", result }),
  isComplete: (state) => state.questions.length > 0 && state.questions.every((question) => Boolean(state.results[question.id])),
  extractResults: (state) => state.questions.flatMap((question) => state.results[question.id] ? [state.results[question.id]!] : []),
};

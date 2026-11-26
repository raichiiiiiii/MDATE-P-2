import type { ComponentType } from "react";

export type GameModeId = "find_the_pair" | "challenge" | "story_telling" | "standard_qset";

export interface RewardedQuestion {
  id: string;
  qSetId: string;
  difficulty: number;
  rewardCoins: number;
  prompt: string;
  media?: {
    outlineUrl?: string | null;
    colorUrl?: string | null;
    promptUrl?: string | null;
  };
  answerPayload: Record<string, unknown>;
}

export interface QuestionAttemptResult {
  questionId: string;
  correct: boolean;
  attempts: number;
  durationMs: number;
  responseText?: string;
  narrativeText?: string;
}

export interface GameEngineAdapter<TState, TAction> {
  modeId: GameModeId;
  createInitialState(questions: RewardedQuestion[]): TState;
  reduce(state: TState, action: TAction): TState;
  createResultAction(result: QuestionAttemptResult): TAction;
  isComplete(state: TState): boolean;
  extractResults(state: TState): QuestionAttemptResult[];
}

export interface GameViewProps<TState, TAction> {
  questions: RewardedQuestion[];
  state: TState;
  dispatch: (action: TAction) => void;
  recordResult: (result: QuestionAttemptResult) => Promise<unknown>;
  onFinish: () => Promise<unknown>;
  busy: boolean;
  totalPossibleCoins: number;
  earnedSoFarCoins: number;
}

export interface GameModeRegistration<TState = unknown, TAction = unknown> {
  modeId: GameModeId;
  displayName: string;
  description: string;
  engine: GameEngineAdapter<TState, TAction>;
  Component: ComponentType<GameViewProps<TState, TAction>>;
}

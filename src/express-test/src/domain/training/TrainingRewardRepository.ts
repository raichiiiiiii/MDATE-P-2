import type { GameModeId } from "./TrainingGameMode.js";

export interface TrainingRewardQSet {
  id: string;
  title: Record<string, string>;
  difficulty: number;
  position: number;
  fibonacciWeight: number;
  questionCount: number;
  inheritedRewardCoins: number;
  questions: Array<{ id: string; position: number; rewardCoins: number }>;
}

export interface TrainingRewardSubmodule {
  id: string;
  slug: string;
  gameMode: GameModeId;
  exerciseType: "try_to_guess" | "tell_me_more" | "find_the_pair";
  name: Record<string, string>;
  instructions: Record<string, string>;
  iconName: string;
  position: number;
  questionCount: number;
  inheritedRewardCoins: number;
  qSets: TrainingRewardQSet[];
}

export interface PublishedRewardTree {
  module: {
    id: string;
    versionId: string;
    versionNumber: number;
    slug: string;
    title: Record<string, string>;
    rewardCoins: number;
  };
  questionCount: number;
  allocatedCoins: number;
  unallocatedCoins: number;
  submodules: TrainingRewardSubmodule[];
}

export interface TrainingRewardRepository {
  getModuleRewardTree(moduleId: string): Promise<PublishedRewardTree | null>;
  getSubmoduleRewardTree(submoduleId: string): Promise<PublishedRewardTree | null>;
}

import type { TrainingRewardRepository } from "../../domain/training/TrainingRewardRepository.js";

export class TrainingRewardService {
  constructor(private readonly rewards: TrainingRewardRepository) {}

  getModuleRewardTree(moduleId: string) {
    return this.rewards.getModuleRewardTree(moduleId);
  }

  getSubmoduleRewardTree(submoduleId: string) {
    return this.rewards.getSubmoduleRewardTree(submoduleId);
  }
}

import type { TrainingContentRepository } from "../../domain/training/TrainingContentRepository.js";

/** Small application boundary for read-only published training content. */
export class TrainingContentService {
  constructor(private readonly content: TrainingContentRepository) {}

  listPublishedModules() {
    return this.content.listPublishedModules();
  }

  getPublishedModule(moduleId: string) {
    return this.content.getPublishedModuleById(moduleId);
  }

  listQSets(submoduleId: string) {
    return this.content.listQSetsBySubmoduleId(submoduleId);
  }

  getQSet(qSetId: string) {
    return this.content.getPublishedQSetById(qSetId);
  }

  getMediaAsset(assetId: string) {
    return this.content.getPublishedMediaAssetById(assetId);
  }
}

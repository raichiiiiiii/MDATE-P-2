export type LocalizedText = Record<string, string>;
export type JsonObject = Record<string, unknown>;

export interface PublishedModuleSummary {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  title: LocalizedText;
  description: LocalizedText;
  supportedLanguages: string[];
  submoduleCount: number;
}

export interface SubmoduleSummary {
  id: string;
  slug: string;
  exerciseType: "try_to_guess" | "tell_me_more" | "find_the_pair";
  name: LocalizedText;
  instructions: LocalizedText;
  iconName: string;
  position: number;
  qSetCount: number;
}

export interface PublishedModuleDetails extends PublishedModuleSummary {
  submodules: SubmoduleSummary[];
}

export interface QSetSummary {
  id: string;
  submoduleId: string;
  title: LocalizedText;
  difficultyIndex: number;
  position: number;
  questionCount: number;
}

export interface PublishedSubmoduleQSets {
  submodule: Omit<SubmoduleSummary, "qSetCount">;
  qSets: QSetSummary[];
}

export interface QuestionMedia {
  id: string;
  role: "prompt_image" | "outline_image" | "color_image" | "supporting_image" | "audio";
  position: number;
  mimeType: string;
  altText: LocalizedText;
}

export interface QSetQuestion {
  id: string;
  position: number;
  content: JsonObject;
  media: QuestionMedia[];
}

export interface PublishedQSetDetails {
  id: string;
  submoduleId: string;
  title: LocalizedText;
  difficultyIndex: number;
  position: number;
  rewardPoolPoints: number;
  submodule: {
    id: string;
    slug: string;
    exerciseType: "try_to_guess" | "tell_me_more" | "find_the_pair";
    name: LocalizedText;
    instructions: LocalizedText;
    iconName: string;
  };
  questions: QSetQuestion[];
}

export interface PublishedMediaAsset {
  id: string;
  storageKey: string;
  mimeType: string;
}

export interface TrainingContentRepository {
  listPublishedModules(): Promise<PublishedModuleSummary[]>;
  getPublishedModuleById(moduleId: string): Promise<PublishedModuleDetails | null>;
  listQSetsBySubmoduleId(submoduleId: string): Promise<PublishedSubmoduleQSets | null>;
  getPublishedQSetById(qSetId: string): Promise<PublishedQSetDetails | null>;
  getPublishedMediaAssetById(assetId: string): Promise<PublishedMediaAsset | null>;
}

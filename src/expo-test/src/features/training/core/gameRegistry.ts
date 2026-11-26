import type { GameModeRegistration } from "./gameTypes";
import { findThePairEngine } from "../games/find-the-pair/findThePairEngine";
import { challengeEngine } from "../games/challenge/challengeModel";
import { storyTellingEngine } from "../games/story-telling/storyTellingModel";
import { standardQSetEngine } from "../games/standard-qset/standardQSetModel";
import FindThePairView from "../games/find-the-pair/FindThePairView";
import ChallengeView from "../games/challenge/ChallengeView";
import StoryTellingView from "../games/story-telling/StoryTellingView";
import StandardQSetView from "../games/standard-qset/StandardQSetView";

const registrations: GameModeRegistration<any, any>[] = [
  { modeId: "find_the_pair", displayName: "Find the Pair", description: "Visual matching and semantic association.", engine: findThePairEngine, Component: FindThePairView },
  { modeId: "challenge", displayName: "Challenge", description: "Guided speech and recall questions.", engine: challengeEngine, Component: ChallengeView },
  { modeId: "story_telling", displayName: "Story Telling", description: "Narrative sequencing and spoken description.", engine: storyTellingEngine, Component: StoryTellingView },
  { modeId: "standard_qset", displayName: "Practice Questions", description: "Sequential question-and-answer practice.", engine: standardQSetEngine, Component: StandardQSetView },
];

const REGISTRY = new Map(registrations.map((registration) => [registration.modeId, registration]));

export function registerGameMode(registration: GameModeRegistration<any, any>): void {
  REGISTRY.set(registration.modeId, registration);
}

/** Unknown persisted values fail safely to the standard question engine. */
export function resolveGameMode(modeId: string): GameModeRegistration<any, any> {
  return REGISTRY.get(modeId as GameModeRegistration["modeId"]) ?? REGISTRY.get("standard_qset")!;
}

export function listGameModes(): GameModeRegistration<any, any>[] {
  return [...REGISTRY.values()];
}

import assert from "node:assert/strict";
import test from "node:test";
import { findThePairEngine } from "../games/find-the-pair/findThePairEngine.js";
import { challengeEngine } from "../games/challenge/challengeModel.js";
import { storyTellingEngine } from "../games/story-telling/storyTellingModel.js";
import { standardQSetEngine } from "../games/standard-qset/standardQSetModel.js";
import type { RewardedQuestion } from "./gameTypes.js";

const questions: RewardedQuestion[] = [
  { id: "q1", qSetId: "set1", difficulty: 0, rewardCoins: 5, prompt: "One", answerPayload: {} },
  { id: "q2", qSetId: "set1", difficulty: 0, rewardCoins: 7, prompt: "Two", answerPayload: {} },
];

test("four registrations are distinct and each adapter has its own mode contract", () => {
  assert.deepEqual(
    [findThePairEngine.modeId, challengeEngine.modeId, storyTellingEngine.modeId, standardQSetEngine.modeId],
    ["find_the_pair", "challenge", "story_telling", "standard_qset"],
  );
  assert.notEqual(findThePairEngine.createInitialState, challengeEngine.createInitialState);
});

test("Find the Pair only completes after unique pair matches", () => {
  let state = findThePairEngine.createInitialState(questions);
  state = findThePairEngine.reduce(state, { type: "PAIR_MATCHED", result: { questionId: "q1", correct: true, attempts: 2, durationMs: 0 } });
  state = findThePairEngine.reduce(state, { type: "PAIR_MATCHED", result: { questionId: "q1", correct: true, attempts: 2, durationMs: 0 } });
  assert.equal(state.matchedQuestionIds.length, 1);
  assert.equal(findThePairEngine.isComplete(state), false);
  state = findThePairEngine.reduce(state, { type: "PAIR_MATCHED", result: { questionId: "q2", correct: true, attempts: 1, durationMs: 0 } });
  assert.equal(findThePairEngine.isComplete(state), true);
});

test("Challenge retains the response transcript with its result", () => {
  let state = challengeEngine.createInitialState(questions);
  state = challengeEngine.reduce(state, challengeEngine.createResultAction({ questionId: "q1", correct: true, attempts: 1, durationMs: 50, responseText: "car" }));
  assert.equal(state.transcriptByQuestion.q1, "car");
  assert.equal(challengeEngine.extractResults(state).length, 1);
});

test("Story Telling stores narrative text separately from answer results", () => {
  let state = storyTellingEngine.createInitialState(questions);
  state = storyTellingEngine.reduce(state, storyTellingEngine.createResultAction({ questionId: "q1", correct: true, attempts: 1, durationMs: 0, narrativeText: "A child is reading." }));
  assert.equal(state.narratives.q1, "A child is reading.");
});

test("Standard Q-Set advances deterministically through unanswered questions", () => {
  let state = standardQSetEngine.createInitialState(questions);
  state = standardQSetEngine.reduce(state, standardQSetEngine.createResultAction({ questionId: "q1", correct: false, attempts: 1, durationMs: 0 }));
  assert.equal(state.activeQuestionId, "q2");
  assert.equal(standardQSetEngine.isComplete(state), false);
  state = standardQSetEngine.reduce(state, standardQSetEngine.createResultAction({ questionId: "q2", correct: true, attempts: 1, durationMs: 0 }));
  assert.equal(standardQSetEngine.isComplete(state), true);
});

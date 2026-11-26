import assert from "node:assert/strict";
import test from "node:test";
import { calculateModuleRewardTree } from "./RewardCalculator.js";

test("Hamilton allocation conserves a 100-coin pool across 3, 7 and 12 questions", () => {
  const tree = calculateModuleRewardTree(
    { id: "v1", rewardCoins: 100 },
    [
      { id: "s1", moduleId: "v1" },
      { id: "s2", moduleId: "v1" },
      { id: "s3", moduleId: "v1" },
    ],
    [
      { id: "q1", submoduleId: "s1", difficulty: 0, position: 0 },
      { id: "q2", submoduleId: "s2", difficulty: 0, position: 0 },
      { id: "q3", submoduleId: "s3", difficulty: 0, position: 0 },
    ],
    [
      ...Array.from({ length: 3 }, (_, i) => ({ id: `a${i}`, qSetId: "q1", position: i })),
      ...Array.from({ length: 7 }, (_, i) => ({ id: `b${i}`, qSetId: "q2", position: i })),
      ...Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, qSetId: "q3", position: i })),
    ],
  );

  assert.equal(tree.allocatedCoins, 100);
  assert.equal(tree.unallocatedCoins, 0);
  assert.deepEqual(
    tree.submodules.map((submodule) => submodule.inheritedRewardCoins),
    [15, 35, 50],
  );
  assert.equal(tree.submodules.flatMap((item) => item.qSets).flatMap((item) => item.questions)
    .reduce((sum, question) => sum + question.rewardCoins, 0), 100);
});

test("duplicate difficulty QSets share one Fibonacci tier pool", () => {
  const tree = calculateModuleRewardTree(
    { id: "v1", rewardCoins: 60 },
    [{ id: "s1", moduleId: "v1" }],
    [
      { id: "q0", submoduleId: "s1", difficulty: 0, position: 0 },
      { id: "q1a", submoduleId: "s1", difficulty: 1, position: 1 },
      { id: "q1b", submoduleId: "s1", difficulty: 1, position: 2 },
    ],
    [
      { id: "a", qSetId: "q0", position: 0 },
      { id: "b", qSetId: "q1a", position: 0 },
      { id: "c", qSetId: "q1b", position: 0 },
    ],
  );

  const qSets = tree.submodules[0]!.qSets;
  assert.equal(qSets[0]!.fibonacciWeight, 1);
  assert.equal(qSets[1]!.fibonacciWeight, 2);
  assert.equal(qSets[2]!.fibonacciWeight, 2);
  assert.equal(qSets.reduce((sum, item) => sum + item.inheritedRewardCoins, 0), 60);
  assert.deepEqual(qSets.map((item) => item.inheritedRewardCoins), [20, 20, 20]);
});

test("same-difficulty QSets use the grouped tier weight, not separate difficulty tiers", () => {
  const tree = calculateModuleRewardTree(
    { id: "v1", rewardCoins: 100 },
    [{ id: "s1", moduleId: "v1" }],
    [
      { id: "easy", submoduleId: "s1", difficulty: 0, position: 0 },
      { id: "hard-a", submoduleId: "s1", difficulty: 1, position: 1 },
      { id: "hard-b", submoduleId: "s1", difficulty: 1, position: 2 },
    ],
    [
      { id: "e", qSetId: "easy", position: 0 },
      { id: "ha", qSetId: "hard-a", position: 0 },
      { id: "hb", qSetId: "hard-b", position: 0 },
    ],
  );
  const items = tree.submodules[0]!.qSets;
  assert.deepEqual(items.map((item) => item.inheritedRewardCoins), [33, 34, 33]);
  assert.equal(tree.allocatedCoins, 100);
});

test("a module with no active questions has no division and keeps its pool unallocated", () => {
  const tree = calculateModuleRewardTree(
    { id: "v1", rewardCoins: 100 },
    [{ id: "s1", moduleId: "v1" }],
    [{ id: "q1", submoduleId: "s1", difficulty: 0, position: 0 }],
    [{ id: "inactive", qSetId: "q1", position: 0, isActive: false }],
  );
  assert.equal(tree.questionCount, 0);
  assert.equal(tree.allocatedCoins, 0);
  assert.equal(tree.unallocatedCoins, 100);
  assert.equal(tree.submodules[0]!.inheritedRewardCoins, 0);
});

test("Hamilton ties are deterministic: harder difficulty, then QSet ID, then question order", () => {
  const input = {
    module: { id: "v1", rewardCoins: 2 },
    submodules: [{ id: "s1", moduleId: "v1" }],
    qSets: [
      { id: "q-b", submoduleId: "s1", difficulty: 1, position: 1 },
      { id: "q-a", submoduleId: "s1", difficulty: 0, position: 0 },
    ],
    questions: [
      { id: "b", qSetId: "q-b", position: 0 },
      { id: "a", qSetId: "q-a", position: 0 },
      { id: "c", qSetId: "q-a", position: 1 },
    ],
  };
  const first = calculateModuleRewardTree(input.module, input.submodules, input.qSets, input.questions);
  const second = calculateModuleRewardTree(input.module, input.submodules, input.qSets, input.questions);
  assert.deepEqual(first, second);
  assert.equal(first.allocatedCoins, 2);
});

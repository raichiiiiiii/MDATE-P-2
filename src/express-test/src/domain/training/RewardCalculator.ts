export interface RewardModuleInput {
  id: string;
  moduleVersionId?: string;
  rewardCoins: number;
}

export interface RewardSubmoduleInput {
  id: string;
  moduleId: string;
}

export interface RewardQSetInput {
  id: string;
  submoduleId: string;
  difficulty: number;
  position: number;
}

export interface RewardQuestionInput {
  id: string;
  qSetId: string;
  position: number;
  isActive?: boolean;
}

export interface RewardQuestionAllocation {
  id: string;
  qSetId: string;
  difficulty: number;
  questionOrder: number;
  rewardCoins: number;
}

export interface RewardQSetAllocation {
  id: string;
  difficulty: number;
  position: number;
  fibonacciWeight: number;
  questionCount: number;
  inheritedRewardCoins: number;
  questions: RewardQuestionAllocation[];
}

export interface RewardSubmoduleAllocation {
  id: string;
  questionCount: number;
  inheritedRewardCoins: number;
  qSets: RewardQSetAllocation[];
}

export interface RewardModuleTree {
  id: string;
  moduleVersionId: string | null;
  rewardCoins: number;
  questionCount: number;
  allocatedCoins: number;
  unallocatedCoins: number;
  submodules: RewardSubmoduleAllocation[];
}

interface ExactShare {
  question: RewardQuestionAllocation;
  numerator: bigint;
  denominator: bigint;
  floor: bigint;
  remainder: bigint;
}

function assertSafeNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

function fibonacciWeights(count: number): bigint[] {
  const result: bigint[] = [];
  let previous = 1n;
  let current = 2n;

  for (let index = 0; index < count; index += 1) {
    if (index === 0) result.push(previous);
    else if (index === 1) result.push(current);
    else {
      const next = previous + current;
      previous = current;
      current = next;
      result.push(next);
    }
  }
  return result;
}

function compareRemaindersDescending(left: ExactShare, right: ExactShare): number {
  const leftScaled = left.remainder * right.denominator;
  const rightScaled = right.remainder * left.denominator;
  if (leftScaled > rightScaled) return -1;
  if (leftScaled < rightScaled) return 1;

  if (left.question.difficulty !== right.question.difficulty) {
    return right.question.difficulty - left.question.difficulty;
  }
  const qSetOrder = left.question.qSetId.localeCompare(right.question.qSetId);
  if (qSetOrder !== 0) return qSetOrder;
  if (left.question.questionOrder !== right.question.questionOrder) {
    return left.question.questionOrder - right.question.questionOrder;
  }
  return left.question.id.localeCompare(right.question.id);
}

/**
 * Calculate a complete Module -> Submodule -> Q-Set -> Question reward tree.
 *
 * Exact rational shares are retained with BigInt until Hamilton allocation.
 * When a module has no active questions, its full pool is reported as
 * unallocated and every child receives zero. Otherwise all allocated integer
 * question rewards sum exactly to module.rewardCoins.
 */
export function calculateModuleRewardTree(
  module: RewardModuleInput,
  submodules: readonly RewardSubmoduleInput[],
  qSets: readonly RewardQSetInput[],
  questions: readonly RewardQuestionInput[],
): RewardModuleTree {
  assertSafeNonNegativeInteger(module.rewardCoins, "module.rewardCoins");

  const moduleSubmodules = submodules
    .filter((item) => item.moduleId === module.id)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  const submoduleIds = new Set(moduleSubmodules.map((item) => item.id));
  const moduleQSets = qSets
    .filter((item) => submoduleIds.has(item.submoduleId))
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const qSet of moduleQSets) {
    assertSafeNonNegativeInteger(qSet.difficulty, `qSet(${qSet.id}).difficulty`);
    assertSafeNonNegativeInteger(qSet.position, `qSet(${qSet.id}).position`);
  }

  const qSetById = new Map(moduleQSets.map((item) => [item.id, item]));
  const activeQuestions = questions
    .filter((item) => item.isActive !== false && qSetById.has(item.qSetId))
    .slice()
    .sort((a, b) => {
      const qSetOrder = a.qSetId.localeCompare(b.qSetId);
      return qSetOrder || a.position - b.position || a.id.localeCompare(b.id);
    });

  for (const question of activeQuestions) {
    assertSafeNonNegativeInteger(question.position, `question(${question.id}).position`);
  }

  const questionsByQSet = new Map<string, RewardQuestionInput[]>();
  for (const question of activeQuestions) {
    const current = questionsByQSet.get(question.qSetId) ?? [];
    current.push(question);
    questionsByQSet.set(question.qSetId, current);
  }

  const qSetsBySubmodule = new Map<string, RewardQSetInput[]>();
  for (const qSet of moduleQSets) {
    const current = qSetsBySubmodule.get(qSet.submoduleId) ?? [];
    current.push(qSet);
    qSetsBySubmodule.set(qSet.submoduleId, current);
  }

  const questionCountBySubmodule = new Map<string, number>();
  let totalQuestionCount = 0;
  for (const submodule of moduleSubmodules) {
    const count = (qSetsBySubmodule.get(submodule.id) ?? [])
      .reduce((sum, qSet) => sum + (questionsByQSet.get(qSet.id)?.length ?? 0), 0);
    questionCountBySubmodule.set(submodule.id, count);
    totalQuestionCount += count;
  }

  const exactShares: ExactShare[] = [];
  const stagedSubmodules: RewardSubmoduleAllocation[] = moduleSubmodules.map((submodule) => {
    const activeQSets = (qSetsBySubmodule.get(submodule.id) ?? [])
      .filter((qSet) => (questionsByQSet.get(qSet.id)?.length ?? 0) > 0);
    const tierDifficulties = [...new Set(activeQSets.map((qSet) => qSet.difficulty))]
      .sort((a, b) => a - b);
    const weights = fibonacciWeights(tierDifficulties.length);
    const totalWeight = weights.reduce((sum, item) => sum + item, 0n);

    const qSetCountByDifficulty = new Map<number, number>();
    for (const qSet of activeQSets) {
      qSetCountByDifficulty.set(
        qSet.difficulty,
        (qSetCountByDifficulty.get(qSet.difficulty) ?? 0) + 1,
      );
    }

    const stagedQSets: RewardQSetAllocation[] = (qSetsBySubmodule.get(submodule.id) ?? [])
      .map((qSet) => {
        const questionInputs = questionsByQSet.get(qSet.id) ?? [];
        const tierIndex = tierDifficulties.indexOf(qSet.difficulty);
        const weight = tierIndex >= 0 ? weights[tierIndex]! : 0n;
        const qSetCountInTier = qSetCountByDifficulty.get(qSet.difficulty) ?? 0;
        const rewardQuestions: RewardQuestionAllocation[] = questionInputs.map((question) => ({
          id: question.id,
          qSetId: qSet.id,
          difficulty: qSet.difficulty,
          questionOrder: question.position,
          rewardCoins: 0,
        }));

        if (questionInputs.length > 0 && totalQuestionCount > 0 && totalWeight > 0n) {
          const numerator =
            BigInt(module.rewardCoins) *
            BigInt(questionCountBySubmodule.get(submodule.id) ?? 0) *
            weight;
          const denominator =
            BigInt(totalQuestionCount) *
            totalWeight *
            BigInt(qSetCountInTier) *
            BigInt(questionInputs.length);

          for (const rewardQuestion of rewardQuestions) {
            const quotient = numerator / denominator;
            const remainder = numerator % denominator;
            exactShares.push({
              question: rewardQuestion,
              numerator,
              denominator,
              floor: quotient,
              remainder,
            });
          }
        }

        return {
          id: qSet.id,
          difficulty: qSet.difficulty,
          position: qSet.position,
          fibonacciWeight: Number(weight),
          questionCount: rewardQuestions.length,
          inheritedRewardCoins: 0,
          questions: rewardQuestions,
        };
      });

    return {
      id: submodule.id,
      questionCount: questionCountBySubmodule.get(submodule.id) ?? 0,
      inheritedRewardCoins: 0,
      qSets: stagedQSets,
    };
  });

  if (totalQuestionCount === 0) {
    return {
      id: module.id,
      moduleVersionId: module.moduleVersionId ?? null,
      rewardCoins: module.rewardCoins,
      questionCount: 0,
      allocatedCoins: 0,
      unallocatedCoins: module.rewardCoins,
      submodules: stagedSubmodules,
    };
  }

  const floorTotal = exactShares.reduce((sum, share) => sum + share.floor, 0n);
  const remaining = BigInt(module.rewardCoins) - floorTotal;
  const orderedShares = exactShares.slice().sort(compareRemaindersDescending);

  if (remaining < 0n || remaining > BigInt(orderedShares.length)) {
    throw new Error("Hamilton allocation invariant failed: remaining coin count is out of range.");
  }

  const extraRecipients = new Set(
    orderedShares.slice(0, Number(remaining)).map((share) => share.question.id),
  );

  const rewardByQuestionId = new Map<string, number>();
  for (const share of exactShares) {
    const amount = share.floor + (extraRecipients.has(share.question.id) ? 1n : 0n);
    rewardByQuestionId.set(share.question.id, Number(amount));
  }

  let allocatedCoins = 0;
  for (const submodule of stagedSubmodules) {
    for (const qSet of submodule.qSets) {
      qSet.inheritedRewardCoins = qSet.questions.reduce((sum, question) => {
        question.rewardCoins = rewardByQuestionId.get(question.id) ?? 0;
        allocatedCoins += question.rewardCoins;
        return sum + question.rewardCoins;
      }, 0);
    }
    submodule.inheritedRewardCoins = submodule.qSets
      .reduce((sum, qSet) => sum + qSet.inheritedRewardCoins, 0);
  }

  if (allocatedCoins !== module.rewardCoins) {
    throw new Error(`Reward conservation invariant failed: allocated ${allocatedCoins}, expected ${module.rewardCoins}.`);
  }

  return {
    id: module.id,
    moduleVersionId: module.moduleVersionId ?? null,
    rewardCoins: module.rewardCoins,
    questionCount: totalQuestionCount,
    allocatedCoins,
    unallocatedCoins: 0,
    submodules: stagedSubmodules,
  };
}

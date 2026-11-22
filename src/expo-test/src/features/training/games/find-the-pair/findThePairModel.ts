import {
  localize,
  localizeList,
  type Language,
  type QSetDetails,
  type QSetQuestion,
  type QuestionMedia,
} from "../../trainingApi";

export type PairQuestion = QSetQuestion & {
  pairLabel: string;
  hint: string;
  outlineImage: QuestionMedia;
  colorImage: QuestionMedia;
};

export type SelectedPairCard = {
  questionId: string;
  side: "outline" | "color";
} | null;

export function shuffleCards<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function buildPairQuestions(qSet: QSetDetails, language: Language): PairQuestion[] {
  if (qSet.submodule.exerciseType !== "find_the_pair") {
    throw new Error("This practice set is not a Find the Pair activity.");
  }
  if (qSet.questions.length !== 5) {
    throw new Error("Each Find the Pair set must contain exactly five pairs.");
  }

  const orderedQuestions = [...qSet.questions].sort((left, right) => left.position - right.position);
  if (orderedQuestions.some((question, index) => question.position !== index)) {
    throw new Error("Each Find the Pair set must use question positions 0 through 4.");
  }

  return orderedQuestions.map((question) => {
    const outlines = question.media.filter((item) => item.role === "outline_image");
    const colors = question.media.filter((item) => item.role === "color_image");
    if (question.media.length !== 2 || outlines.length !== 1 || colors.length !== 1 || outlines[0]?.id === colors[0]?.id) {
      throw new Error(`Pair ${question.position + 1} must have exactly one outline and one colour image.`);
    }
    if (outlines[0].position !== 0 || colors[0].position !== 0 ||
        !outlines[0].mimeType.startsWith("image/") || !colors[0].mimeType.startsWith("image/") || !outlines[0].url || !colors[0].url) {
      throw new Error(`Pair ${question.position + 1} contains a non-image media asset.`);
    }

    const pairLabel = localize(question.content.pairLabel, language);
    const hint = localizeList(question.content.hints, language)[0] ?? "";
    if (!pairLabel || !hint) {
      throw new Error(`Pair ${question.position + 1} is missing its ${language} label or hint.`);
    }

    return {
      ...question,
      pairLabel,
      hint,
      outlineImage: outlines[0],
      colorImage: colors[0],
    };
  });
}

export function rewardForPair(questionId: string, hintedQuestionIds: ReadonlySet<string>): 5 | 10 {
  return hintedQuestionIds.has(questionId) ? 5 : 10;
}

export function getFindThePairScore(baseCoins: number, hintedCount: number, totalCorrect: number) {
  const completionBonus = totalCorrect === 10 ? 20 : 0;
  const perfectBonus = totalCorrect === 10 && hintedCount === 0 ? 50 : 0;
  return {
    baseCoins,
    completionBonus,
    perfectBonus,
    finalCoins: baseCoins + completionBonus + perfectBonus,
  };
}

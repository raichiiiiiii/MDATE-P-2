import {
  whisperWorker,
  type SpeechLanguageCode,
  type TranscriptionResult,
} from "../../infrastructure/speech/WhisperWorker.js";

export type SpeechLanguage = SpeechLanguageCode;

export interface AnswerEvaluation {
  match: "EXACT_MATCH" | "PARTIAL_MATCH" | "NO_MATCH";
  correct: boolean;
}

function normalizeWords(value: string, language: SpeechLanguage): string[] {
  const locale = language === "ms" ? "ms-MY" : "en-US";
  return value
    .normalize("NFKC")
    .toLocaleLowerCase(locale)
    .replace(/[\p{P}\p{S}]/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

export class SpeechAssessmentService {
  transcribe(audioPath: string, language: SpeechLanguage): Promise<TranscriptionResult> {
    if (typeof audioPath !== "string" || audioPath.trim().length === 0) {
      throw new Error("An audio file is required.");
    }

    return whisperWorker.transcribe(audioPath, language);
  }

  /**
   * Prototype lexical comparison only. It intentionally does not emit a
   * therapeutic score; MDATE's configured assessment rules must own that.
   */
  evaluate(answer: string, target: string, language: SpeechLanguage): AnswerEvaluation {
    const answerWords = normalizeWords(answer, language);
    const targetWords = normalizeWords(target, language);

    if (answerWords.length === 0 || targetWords.length === 0) {
      return { match: "NO_MATCH", correct: false };
    }

    if (answerWords.join(" ") === targetWords.join(" ")) {
      return { match: "EXACT_MATCH", correct: true };
    }

    // A partial match requires at least one shared whole word, not a substring
    // inside another word. This remains a demonstration rule, not clinical scoring.
    const targetSet = new Set(targetWords);
    const sharedWords = answerWords.filter((word) => targetSet.has(word));
    if (sharedWords.length > 0) {
      return { match: "PARTIAL_MATCH", correct: false };
    }

    return { match: "NO_MATCH", correct: false };
  }
}

export const speechAssessmentService = new SpeechAssessmentService();

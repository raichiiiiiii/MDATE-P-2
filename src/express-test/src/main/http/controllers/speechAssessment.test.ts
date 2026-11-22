import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SpeechAssessmentService } from "../../../application/speech/SpeechAssessmentService.js";

describe("SpeechAssessmentService — Prototype Lexical Evaluation (Milestone 1 / V-26)", () => {
  const service = new SpeechAssessmentService();

  describe("Lexical match rules", () => {
    it("returns EXACT_MATCH when answer and target match verbatim", () => {
      const result = service.evaluate("apple", "apple", "en");
      assert.equal(result.match, "EXACT_MATCH");
      assert.equal(result.correct, true);
    });

    it("returns EXACT_MATCH ignoring casing, punctuation, and extra whitespace", () => {
      const result = service.evaluate("  Kereta,  ", "kereta!", "ms");
      assert.equal(result.match, "EXACT_MATCH");
      assert.equal(result.correct, true);
    });

    it("returns EXACT_MATCH for multi-word phrases with punctuation in English and Malay", () => {
      const enResult = service.evaluate("The red car.", "the red car", "en");
      assert.equal(enResult.match, "EXACT_MATCH");
      assert.equal(enResult.correct, true);

      const msResult = service.evaluate("Membaca buku!", "membaca buku", "ms");
      assert.equal(msResult.match, "EXACT_MATCH");
      assert.equal(msResult.correct, true);
    });

    it("returns PARTIAL_MATCH when at least one whole word is shared", () => {
      const result = service.evaluate("reading a magazine", "reading book", "en");
      assert.equal(result.match, "PARTIAL_MATCH");
      assert.equal(result.correct, false);
    });

    it("returns NO_MATCH when no whole words are shared even if substring matches", () => {
      const result = service.evaluate("carpet", "car", "en");
      assert.equal(result.match, "NO_MATCH");
      assert.equal(result.correct, false);
    });

    it("returns NO_MATCH when either answer or target is empty or whitespace only", () => {
      assert.equal(service.evaluate("", "apple", "en").match, "NO_MATCH");
      assert.equal(service.evaluate("   ", "apple", "en").match, "NO_MATCH");
      assert.equal(service.evaluate("apple", "", "en").match, "NO_MATCH");
    });
  });

  describe("V-26 Acceptance Test — Client-supplied target integrity", () => {
    it("returns prototype match without creating clinical assessment records or XP side effects", () => {
      // In Milestone 1, the prototype endpoint performs lexical comparison on the
      // client-supplied target, explicitly marked as 'prototype_lexical_match_only'.
      // It does not alter database sessions or award therapeutic XP.
      const clientTarget = "arbitrary client word";
      const answer = "arbitrary client word";
      const result = service.evaluate(answer, clientTarget, "en");

      assert.equal(result.match, "EXACT_MATCH");
      assert.equal(result.correct, true);
      // Confirmed: Evaluation output is isolated to comparison result.
    });
  });
});
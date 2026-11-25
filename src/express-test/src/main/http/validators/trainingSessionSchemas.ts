import { z } from "zod";

export const startTrainingSessionSchema = z.object({
  submoduleId: z.string().uuid(),
});

export const recordTrainingMatchSchema = z.object({
  questionId: z.string().uuid(),
});

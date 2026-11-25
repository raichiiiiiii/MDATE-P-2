import { z } from "zod";

export const walletClaimSchema = z.object({
  reason: z.enum(["SESSION_COMPLETE", "DAILY_CHECKIN"]),
  referenceId: z.string().uuid().optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
}).superRefine((value, context) => {
  if (value.reason === "SESSION_COMPLETE" && !value.referenceId) {
    context.addIssue({ code: "custom", path: ["referenceId"], message: "A completed training session ID is required." });
  }
  if (value.reason === "DAILY_CHECKIN" && value.referenceId) {
    context.addIssue({ code: "custom", path: ["referenceId"], message: "Daily check-ins do not accept a reference ID." });
  }
});

export const walletSpendSchema = z.object({
  itemId: z.string().trim().min(1).max(128),
  idempotencyKey: z.string().trim().min(8).max(128),
});

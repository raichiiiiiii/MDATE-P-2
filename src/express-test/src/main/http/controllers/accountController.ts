import type { RequestHandler } from "express";
import type { AccountSnapshot } from "../../../domain/identity/Account.js";
import { completeAccountSetup, getCurrentAccount, updateAccountPreferences } from "../../container.js";
import { accountSetupSchema } from "../validators/accountSetupSchema.js";
import { accountPreferencesSchema } from "../validators/accountPreferencesSchema.js";

function getUserId(res: Parameters<RequestHandler>[1]): string {
  return res.locals.userId as string;
}

function isUnavailable(status: string): boolean {
  return status === "SUSPENDED" || status === "DELETED";
}

function toPreferences(account: AccountSnapshot) {
  return {
    preferredLanguage: account.preferredLanguage,
    accessibilityPreferences: account.accessibilityPreferences,
    voicePreferences: account.voicePreferences,
  };
}

export const currentAccountController: RequestHandler = async (_req, res, next) => {
  try {
    const account = await getCurrentAccount.execute(getUserId(res));
    if (!account || isUnavailable(account.status)) {
      res.status(403).json({ error: "account_unavailable", message: "This MDATE account is not available." });
      return;
    }
    res.json({ account, nextStep: account.setupCompletedAt ? "dashboard" : "account_setup" });
  } catch (error) { next(error); }
};

export const completeAccountSetupController: RequestHandler = async (req, res, next) => {
  const parsed = accountSetupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_request",
      message: "Please check the account setup fields.",
      details: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    return;
  }
  try {
    const account = await completeAccountSetup.execute(getUserId(res), parsed.data);
    if (!account) {
      res.status(403).json({ error: "setup_not_allowed", message: "Account setup could not be completed." });
      return;
    }
    res.json({ account, nextStep: "dashboard" });
  } catch (error) { next(error); }
};

export const currentPreferencesController: RequestHandler = async (_req, res, next) => {
  try {
    const account = await getCurrentAccount.execute(getUserId(res));
    if (!account || isUnavailable(account.status)) {
      res.status(403).json({ error: "account_unavailable", message: "This MDATE account is not available." });
      return;
    }
    if (account.status !== "ACTIVE" || !account.setupCompletedAt) {
      res.status(403).json({ error: "account_setup_required", message: "Complete account setup before editing preferences." });
      return;
    }
    res.json({ preferences: toPreferences(account) });
  } catch (error) { next(error); }
};

export const updatePreferencesController: RequestHandler = async (req, res, next) => {
  const parsed = accountPreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_request",
      message: "Please check your settings and try again.",
      details: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  try {
    const account = await updateAccountPreferences.execute(getUserId(res), parsed.data);
    if (!account) {
      res.status(403).json({ error: "account_setup_required", message: "Complete account setup before editing preferences." });
      return;
    }
    res.json({ preferences: toPreferences(account) });
  } catch (error) { next(error); }
};

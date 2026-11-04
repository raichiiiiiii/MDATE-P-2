import type { RequestHandler } from "express";
import type { AccountSnapshot } from "../../../domain/identity/Account.js";

export const requireActiveUser: RequestHandler = (_req, res, next) => {
  const account = res.locals.account as AccountSnapshot | undefined;
  if (!account || account.status !== "ACTIVE" || !account.setupCompletedAt) {
    res.status(403).json({
      error: "account_setup_required",
      message: "Complete account setup before accessing this feature.",
    });
    return;
  }
  next();
};

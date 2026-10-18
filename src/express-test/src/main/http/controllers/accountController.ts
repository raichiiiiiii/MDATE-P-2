import type { RequestHandler } from "express";

import {
  bootstrapAccount,
  completeAccountSetup,
  getCurrentAccount,
} from "../../container.js";

import { accountSetupSchema } from "../validators/accountSetupSchema.js";

function getSubject(res: Parameters<RequestHandler>[1]): string {
  return res.locals.auth0Subject as string;
}

function isUnavailable(status: string): boolean {
  return status === "SUSPENDED" || status === "DELETED";
}

function getNextStep(setupCompletedAt: string | null) {
  return setupCompletedAt ? "dashboard" : "account_setup";
}

export const bootstrapAccountController: RequestHandler = async (
  _req,
  res,
  next
) => {
  try {
    const result = await bootstrapAccount.execute(getSubject(res));
    const { account } = result;

    if (isUnavailable(account.status)) {
      res.status(403).json({
        error: "account_unavailable",
        message: "This MDATE account is not available.",
      });
      return;
    }

    res.status(result.created ? 201 : 200).json({
      account,
      nextStep: getNextStep(account.setupCompletedAt),
    });
  } catch (error) {
    next(error);
  }
};

export const currentAccountController: RequestHandler = async (
  _req,
  res,
  next
) => {
  try {
    const account = await getCurrentAccount.execute(getSubject(res));

    if (!account) {
      res.status(404).json({
        error: "account_not_provisioned",
        message: "Bootstrap the MDATE account before requesting it.",
      });
      return;
    }

    if (isUnavailable(account.status)) {
      res.status(403).json({
        error: "account_unavailable",
        message: "This MDATE account is not available.",
      });
      return;
    }

    res.json({
      account,
      nextStep: getNextStep(account.setupCompletedAt),
    });
  } catch (error) {
    next(error);
  }
};

export const completeAccountSetupController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const parsed = accountSetupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "invalid_request",
        message: "Please check the account setup fields.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const subject = getSubject(res);
    const existing = await getCurrentAccount.execute(subject);

    if (!existing) {
      res.status(404).json({
        error: "account_not_provisioned",
        message: "Bootstrap the MDATE account before completing setup.",
      });
      return;
    }

    if (isUnavailable(existing.status)) {
      res.status(403).json({
        error: "account_unavailable",
        message: "This MDATE account is not available.",
      });
      return;
    }

    const account = await completeAccountSetup.execute(
      subject,
      parsed.data
    );

    if (!account) {
      res.status(403).json({
        error: "setup_not_allowed",
        message: "Account setup could not be completed.",
      });
      return;
    }

    res.json({
      account,
      nextStep: "dashboard",
    });
  } catch (error) {
    next(error);
  }
};

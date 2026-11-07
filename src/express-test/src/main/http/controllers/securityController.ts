import type { RequestHandler } from "express";
import { accountSecurityService } from "../../container.js";
import {
  CurrentPasswordInvalidError, CurrentEmailUnchangedError, InvalidEmailChangeTokenError,
  NewPasswordUnchangedError, PasswordSetupRequiredError, SessionNotFoundError,
} from "../../../application/security/AccountSecurityService.js";
import { changePasswordSchema, confirmEmailChangeSchema, requestEmailChangeSchema } from "../validators/securitySchemas.js";

function userId(res: Parameters<RequestHandler>[1]): string { return res.locals.userId as string; }
function sessionId(res: Parameters<RequestHandler>[1]): string { return res.locals.sessionId as string; }

function sendSecurityError(error: unknown, res: Parameters<RequestHandler>[1]): boolean {
  if (error instanceof CurrentPasswordInvalidError) { res.status(401).json({ error: "current_password_invalid", message: error.message }); return true; }
  if (error instanceof PasswordSetupRequiredError) { res.status(409).json({ error: "password_setup_required", message: error.message }); return true; }
  if (error instanceof InvalidEmailChangeTokenError) { res.status(400).json({ error: "invalid_email_change_token", message: error.message }); return true; }
  if (error instanceof SessionNotFoundError) { res.status(404).json({ error: "session_not_found", message: error.message }); return true; }
  if (error instanceof NewPasswordUnchangedError || error instanceof CurrentEmailUnchangedError) { res.status(400).json({ error: "invalid_request", message: error.message }); return true; }
  if (error instanceof Error && error.message === "This email address is already registered.") { res.status(409).json({ error: "email_already_registered", message: error.message }); return true; }
  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505") {
    res.status(409).json({ error: "email_already_registered", message: "This email address is already registered or has a pending verification request." }); return true;
  }
  return false;
}

export const changePasswordController: RequestHandler = async (req, res, next) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request", message: "Enter your current password and a new password of at least 12 characters." }); return; }
  try {
    await accountSecurityService.changePassword({ userId: userId(res), currentSessionId: sessionId(res), ...parsed.data });
    res.json({ message: "Your password has been changed. Other sessions have been signed out." });
  } catch (error) { if (!sendSecurityError(error, res)) next(error); }
};

export const requestEmailChangeController: RequestHandler = async (req, res, next) => {
  const parsed = requestEmailChangeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request", message: "Enter a valid email address and your current password." }); return; }
  try {
    await accountSecurityService.requestEmailChange({ userId: userId(res), ...parsed.data });
    res.status(202).json({ message: "A verification link has been sent to the new email address. Your account email has not changed yet." });
  } catch (error) { if (!sendSecurityError(error, res)) next(error); }
};

export const confirmEmailChangeController: RequestHandler = async (req, res, next) => {
  const parsed = confirmEmailChangeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request", message: "The email verification token is invalid." }); return; }
  try {
    await accountSecurityService.confirmEmailChange(parsed.data.token);
    res.json({ message: "Your MDATE email address has been verified and updated." });
  } catch (error) { if (!sendSecurityError(error, res)) next(error); }
};

export const listSessionsController: RequestHandler = async (_req, res, next) => {
  try {
    const sessions = await accountSecurityService.listSessions(userId(res));
    res.json({ sessions, currentSessionId: sessionId(res) });
  } catch (error) { next(error); }
};

export const revokeSessionController: RequestHandler = async (req, res, next) => {
  const target = typeof req.params.sessionId === "string" ? req.params.sessionId : null;
  if (!target || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(target)) {
    res.status(400).json({ error: "invalid_session_id", message: "The session identifier is invalid." }); return;
  }
  try { await accountSecurityService.revokeSession(userId(res), target); res.status(204).end(); }
  catch (error) { if (!sendSecurityError(error, res)) next(error); }
};

export const revokeOtherSessionsController: RequestHandler = async (_req, res, next) => {
  try {
    await accountSecurityService.revokeOtherSessions(userId(res), sessionId(res));
    res.json({ message: "All other sessions have been signed out." });
  } catch (error) { next(error); }
};

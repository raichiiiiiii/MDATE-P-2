import type { RequestHandler } from "express";
import type { AccountSnapshot } from "../../../domain/identity/Account.js";
import { identityService } from "../../container.js";
import { env } from "../../../shared/configuration/env.js";
import {
  AccountUnavailableError, InvalidCredentialsError, InvalidPasswordResetTokenError,
  InvalidRefreshTokenError,
} from "../../../application/identity/IdentityService.js";
import {
  loginSchema, passwordResetConfirmSchema, passwordResetRequestSchema,
  refreshSchema, registerSchema,
} from "../validators/authSchemas.js";

const REFRESH_COOKIE = "mdate_refresh";
const COOKIE_PATH = "/api/v1/auth";

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      try { return decodeURIComponent(part.slice(separator + 1).trim()); }
      catch { return null; }
    }
  }
  return null;
}

function setRefreshCookie(res: Parameters<RequestHandler>[1], token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Parameters<RequestHandler>[1]): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
  });
}

function isBrowserRequest(req: Parameters<RequestHandler>[0]): boolean {
  return typeof req.headers.origin === "string";
}

function sendSession(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  session: { accessToken: string; refreshToken: string; account: AccountSnapshot },
  status = 200,
): void {
  if (!session.account) throw new Error("Session account is missing.");
  if (isBrowserRequest(req)) setRefreshCookie(res, session.refreshToken);
  res.status(status).json({
    accessToken: session.accessToken,
    accessTokenExpiresIn: env.JWT_ACCESS_TTL_SECONDS,
    ...(isBrowserRequest(req) ? {} : { refreshToken: session.refreshToken }),
    account: session.account,
    nextStep: session.account.setupCompletedAt ? "dashboard" : "account_setup",
  });
}

function sendError(error: unknown, res: Parameters<RequestHandler>[1]): boolean {
  if (error instanceof InvalidCredentialsError) {
    res.status(401).json({ error: "invalid_credentials", message: "Email or password is incorrect." });
    return true;
  }
  if (error instanceof AccountUnavailableError) {
    res.status(403).json({ error: "account_unavailable", message: "This MDATE account is not available." });
    return true;
  }
  if (error instanceof InvalidRefreshTokenError) {
    res.status(401).json({ error: "invalid_refresh_token", message: "Your session has expired. Please sign in again." });
    return true;
  }
  if (error instanceof InvalidPasswordResetTokenError) {
    res.status(400).json({ error: "invalid_reset_token", message: "This password-reset link is invalid or has expired." });
    return true;
  }
  if (typeof error === "object" && error !== null && "code" in error && (error as {code?: string}).code === "23505") {
    res.status(409).json({ error: "email_already_registered", message: "An account with this email already exists." });
    return true;
  }
  return false;
}

export const registerController: RequestHandler = async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Enter a valid email and a password of at least 12 characters." });
    return;
  }
  try {
    const session = await identityService.register(parsed.data.email, parsed.data.password);
    sendSession(req, res, session, 201);
  } catch (error) {
    if (!sendError(error, res)) next(error);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Enter your email and password." });
    return;
  }
  try {
    sendSession(req, res, await identityService.login(parsed.data.email, parsed.data.password));
  } catch (error) {
    if (!sendError(error, res)) next(error);
  }
};

export const refreshController: RequestHandler = async (req, res, next) => {
  const parsed = refreshSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Refresh request is invalid." });
    return;
  }
  const token = isBrowserRequest(req)
    ? readCookie(req.headers.cookie, REFRESH_COOKIE)
    : parsed.data.refreshToken ?? null;
  if (!token) {
    res.status(401).json({ error: "invalid_refresh_token", message: "A refresh session is required." });
    return;
  }
  try {
    sendSession(req, res, await identityService.refresh(token));
  } catch (error) {
    clearRefreshCookie(res);
    if (!sendError(error, res)) next(error);
  }
};

export const logoutController: RequestHandler = async (req, res, next) => {
  const parsed = refreshSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Logout request is invalid." });
    return;
  }
  const token = isBrowserRequest(req)
    ? readCookie(req.headers.cookie, REFRESH_COOKIE)
    : parsed.data.refreshToken ?? null;
  try {
    await identityService.logout(token);
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (error) { next(error); }
};

export const passwordResetRequestController: RequestHandler = async (req, res, next) => {
  const parsed = passwordResetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Enter a valid email address." });
    return;
  }
  try {
    await identityService.requestPasswordReset(parsed.data.email);
    res.status(202).json({ message: "If an account uses this email, password reset instructions will be sent." });
  } catch (error) { next(error); }
};

export const passwordResetConfirmController: RequestHandler = async (req, res, next) => {
  const parsed = passwordResetConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Enter a valid reset token and a password of at least 12 characters." });
    return;
  }
  try {
    await identityService.confirmPasswordReset(parsed.data.token, parsed.data.password);
    res.status(200).json({ message: "Your password has been updated. Sign in with your new password." });
  } catch (error) {
    if (!sendError(error, res)) next(error);
  }
};

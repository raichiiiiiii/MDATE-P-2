import type { RequestHandler } from "express";
import { accessTokenService, accountSecurityService, getCurrentAccount } from "../../container.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: "unauthorized", message: "A valid access token is required." });
    return;
  }

  let userId: string;
  let sessionId: string;
  try {
    ({ userId, sessionId } = await accessTokenService.verify(match[1]!));
  } catch {
    res.status(401).json({ error: "invalid_token", message: "The access token is invalid, expired or belongs to an older session format. Please refresh your session." });
    return;
  }

  try {
    const [account, sessionActive] = await Promise.all([
      getCurrentAccount.execute(userId),
      accountSecurityService.isSessionActive(userId, sessionId),
    ]);
    if (!sessionActive) {
      res.status(401).json({ error: "session_revoked", message: "This session has been signed out. Please sign in again." });
      return;
    }
    if (!account || account.status === "DELETED" || account.status === "SUSPENDED") {
      res.status(403).json({ error: "account_unavailable", message: "This MDATE account is not available." });
      return;
    }
    res.locals.userId = account.id;
    res.locals.sessionId = sessionId;
    res.locals.account = account;
    next();
  } catch (error) {
    next(error);
  }
};

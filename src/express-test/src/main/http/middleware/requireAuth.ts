import type { RequestHandler } from "express";
import { accessTokenService, getCurrentAccount } from "../../container.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: "unauthorized", message: "A valid access token is required." });
    return;
  }

  let userId: string;
  try {
    ({ userId } = await accessTokenService.verify(match[1]!));
  } catch {
    res.status(401).json({ error: "invalid_token", message: "The access token is invalid or expired." });
    return;
  }

  try {
    const account = await getCurrentAccount.execute(userId);
    if (!account || account.status === "DELETED" || account.status === "SUSPENDED") {
      res.status(403).json({ error: "account_unavailable", message: "This MDATE account is not available." });
      return;
    }
    res.locals.userId = account.id;
    res.locals.account = account;
    next();
  } catch (error) {
    next(error);
  }
};

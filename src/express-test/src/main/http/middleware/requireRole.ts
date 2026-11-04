import type { RequestHandler } from "express";
import type { AccountSnapshot } from "../../../domain/identity/Account.js";

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (_req, res, next) => {
    const account = res.locals.account as AccountSnapshot | undefined;
    if (!account || !account.roles.some((role) => allowedRoles.includes(role))) {
      res.status(403).json({ error: "forbidden", message: "You do not have permission to access this resource." });
      return;
    }
    next();
  };
}

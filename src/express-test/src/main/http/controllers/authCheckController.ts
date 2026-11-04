import type { RequestHandler } from "express";

export const authCheckController: RequestHandler = (_req, res) => {
  res.json({ authenticated: true, userId: res.locals.userId });
};

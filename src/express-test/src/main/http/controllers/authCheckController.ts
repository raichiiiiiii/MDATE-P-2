import type { Request, RequestHandler } from "express";

type AuthenticatedRequest = Request & {
  auth?: {
    payload?: {
      sub?: unknown;
    };
  };
};

export const authCheckController: RequestHandler = (req, res) => {
  const subject = (req as AuthenticatedRequest).auth?.payload?.sub;

  if (typeof subject !== "string" || subject.length === 0) {
    res.status(401).json({
      error: "unauthorized",
      message: "A valid authenticated identity is required.",
    });
    return;
  }

  res.json({
    authenticated: true,
    subject,
  });
};

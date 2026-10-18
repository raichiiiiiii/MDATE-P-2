import type { Request, RequestHandler } from "express";

type RequestWithAuth = Request & {
  auth?: {
    payload?: {
      sub?: unknown;
    };
  };
};

export const requireHumanUser: RequestHandler = (req, res, next) => {
  const subject = (req as RequestWithAuth).auth?.payload?.sub;

  if (typeof subject !== "string" || subject.length === 0) {
    res.status(401).json({
      error: "unauthorized",
      message: "A valid authenticated user is required.",
    });
    return;
  }

  // Auth0 Client Credentials tokens conventionally use a subject
  // ending in "@clients". They must not provision patient accounts.
  if (subject.endsWith("@clients")) {
    res.status(403).json({
      error: "human_user_required",
      message: "Sign in as a user before accessing this endpoint.",
    });
    return;
  }

  res.locals.auth0Subject = subject;
  next();
};

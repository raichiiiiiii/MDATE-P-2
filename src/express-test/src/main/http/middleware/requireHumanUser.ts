import type { Request, RequestHandler } from "express";

type RequestWithAuth = Request & {
  auth?: {
    payload?: {
      sub?: unknown;
      [claim: string]: unknown;
    };
  };
};

const MDATE_CLAIMS_NAMESPACE = "https://api.mdate.com/claims/";

export const requireHumanUser: RequestHandler = (req, res, next) => {
  const payload = (req as RequestWithAuth).auth?.payload;
  const subject = payload?.sub;

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

  // These values are accepted only from the signed and validated access token.
  // The client must never be allowed to set account email / verification state.
  const email = payload?.[MDATE_CLAIMS_NAMESPACE + "email"];
  const emailVerified = payload?.[MDATE_CLAIMS_NAMESPACE + "email_verified"];

  res.locals.auth0Subject = subject;
  if (typeof email === "string" && email.trim()) {
    res.locals.auth0Email = email.trim();
  }
  if (typeof emailVerified === "boolean") {
    res.locals.auth0EmailVerified = emailVerified;
  }

  next();
};

import { auth } from "express-oauth2-jwt-bearer";
import { env } from "../../shared/configuration/env.js";

export const requireAuth = auth({
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  audience: env.AUTH0_AUDIENCE,
});

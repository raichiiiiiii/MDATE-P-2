import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { AccessTokenService } from "../../domain/identity/AccessTokenService.js";
import { env } from "../../shared/configuration/env.js";

const key = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export class JwtAccessTokenService implements AccessTokenService {
  async sign(input: { userId: string; roles: string[]; sessionId: string }): Promise<string> {
    return new SignJWT({ roles: input.roles, sid: input.sessionId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(input.userId)
      .setIssuer(env.JWT_ISSUER)
      .setAudience(env.JWT_AUDIENCE)
      .setIssuedAt()
      .setJti(randomUUID())
      .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
      .sign(key);
  }

  async verify(token: string): Promise<{ userId: string; sessionId: string }> {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"], issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE,
    });
    if (typeof payload.sub !== "string" || !payload.sub || typeof payload.sid !== "string" || !payload.sid) {
      throw new Error("Access token is missing its user or session identifier.");
    }
    return { userId: payload.sub, sessionId: payload.sid };
  }
}

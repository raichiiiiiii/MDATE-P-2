import type { RequestHandler } from "express";

/**
 * Compare a browser Origin with the public request origin seen by this API.
 *
 * Nginx preserves the Host header and forwards Cloudflare's X-Forwarded-Proto
 * header. Cloudflare sets X-Forwarded-Proto to the visitor-facing scheme
 * (http or https), even though the Tunnel-to-Nginx hop itself uses HTTP.
 */
export function isSameRequestOrigin(
  originHeader: string,
  hostHeader: string | undefined,
  forwardedProtoHeader: string | undefined,
  fallbackProtocol: string,
): boolean {
  if (!originHeader || !hostHeader) return false;

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }

  // Origin headers are serialized origins, not arbitrary URLs or opaque origins.
  if (
    (origin.protocol !== "http:" && origin.protocol !== "https:") ||
    origin.origin !== originHeader
  ) {
    return false;
  }

  const forwardedProtocol = forwardedProtoHeader
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  const protocol = forwardedProtocol || fallbackProtocol.toLowerCase();
  if (protocol !== "http" && protocol !== "https") return false;

  try {
    const requestOrigin = new URL(`${protocol}://${hostHeader}`).origin;
    return origin.origin === requestOrigin;
  } catch {
    return false;
  }
}

/**
 * Reject cross-origin browser requests without maintaining a fixed hostname
 * allowlist. This supports localhost, permanent hostnames, and rotating
 * Cloudflare Quick Tunnel hostnames while still rejecting another site's
 * Origin header. Requests without Origin (for example, native clients) pass
 * through; authenticated routes still enforce their normal authentication.
 */
export const requireAllowedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;

  if (typeof origin !== "string") {
    next();
    return;
  }

  const allowed = isSameRequestOrigin(
    origin,
    req.get("host"),
    req.get("x-forwarded-proto"),
    req.protocol,
  );

  if (!allowed) {
    res.status(403).json({
      error: "origin_not_allowed",
      message: "This browser origin is not allowed.",
    });
    return;
  }

  next();
};

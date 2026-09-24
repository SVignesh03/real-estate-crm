import { NextRequest } from "next/server";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { UnauthorizedError } from "./errors";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

const SECRET =
  process.env.JWT_SECRET || "enterprise_crm_super_secret_jwt_key_2026";
export const AUTH_COOKIE_NAME = "realestate_crm_session";

/**
 * Creates a signed base64 session token
 */
export function signSessionToken(session: UserSession): string {
  const payload = JSON.stringify({
    ...session,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed base64 session token
 */
export function verifySessionToken(token: string): UserSession | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(encodedPayload)
      .digest("base64url");

    // Constant-time comparison
    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    );
    if (
      !decoded.userId ||
      !decoded.role ||
      (decoded.exp && decoded.exp < Date.now())
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts session from NextRequest cookies or Authorization header
 */
export function getSessionFromRequest(req: NextRequest): UserSession | null {
  // 1. Check Cookie
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    const session = verifySessionToken(cookie.value);
    if (session) return session;
  }

  // 2. Check Authorization Header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const session = verifySessionToken(token);
    if (session) return session;
  }

  return null;
}

/**
 * Extracts session or throws UnauthorizedError
 */
export function requireAuth(req: NextRequest): UserSession {
  const session = getSessionFromRequest(req);
  if (!session) {
    throw new UnauthorizedError("Please log in to perform this action");
  }
  return session;
}

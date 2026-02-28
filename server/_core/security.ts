import type { Express, NextFunction, Request, Response } from "express";
import { ENV } from "./env";

const RATE_LIMIT_MAX_KEYS = 10_000;
const NO_STORE_CACHE_CONTROL = "no-store, no-cache, must-revalidate, max-age=0";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function isSecureRequest(req: Request) {
  if (req.secure || req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const fromForwardedHeader =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0]?.trim()
      : Array.isArray(forwardedFor)
        ? forwardedFor[0]?.split(",")[0]?.trim()
        : undefined;

  const ip =
    fromForwardedHeader ||
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    "unknown";

  return String(ip).trim().toLowerCase();
}

function pruneRateLimitStore(now: number) {
  if (rateLimitStore.size <= RATE_LIMIT_MAX_KEYS) return;

  rateLimitStore.forEach((value, key) => {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}

function consumeRateLimit(options: {
  key: string;
  maxRequests: number;
  windowMs: number;
}) {
  const now = Date.now();
  pruneRateLimitStore(now);

  const entry = rateLimitStore.get(options.key);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      retryAfterSeconds: 0,
    } as const;
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    } as const;
  }

  entry.count += 1;
  rateLimitStore.set(options.key, entry);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  } as const;
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const keySuffix = options.keyGenerator?.(req) ?? getClientIp(req);
    const key = `${options.keyPrefix}:${keySuffix}`;
    const result = consumeRateLimit({
      key,
      maxRequests: options.maxRequests,
      windowMs: options.windowMs,
    });

    if (result.allowed) {
      next();
      return;
    }

    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    res.status(429).json({
      error: options.message ?? "Too many requests. Please try again later.",
    });
  };
}

export function applySecurityMiddleware(app: Express) {
  app.disable("x-powered-by");
  // Respect x-forwarded-* headers from a single trusted proxy/load balancer.
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

    if (req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", NO_STORE_CACHE_CONTROL);
      res.setHeader("Pragma", "no-cache");
    }

    if (ENV.isProduction && isSecureRequest(req)) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

    next();
  });
}

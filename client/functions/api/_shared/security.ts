const NO_STORE_CACHE_CONTROL = "no-store, no-cache, must-revalidate, max-age=0";
const RATE_LIMIT_MAX_KEYS = 20_000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function jsonResponse(
  body: Record<string, unknown>,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": NO_STORE_CACHE_CONTROL,
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeText(value: unknown, maxLen: number) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

export function normalizeMultilineText(value: unknown, maxLen: number) {
  const text = typeof value === "string" ? value.trim() : "";
  const normalized = text.replace(/\r\n?/g, "\n");
  return normalized.length > maxLen ? normalized.slice(0, maxLen) : normalized;
}

export function toHtmlLines(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br/>");
}

export function isValidEmail(value: unknown) {
  if (typeof value !== "string") return false;
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function collectAllowedOrigins(env: Record<string, unknown>) {
  const origins = new Set<string>();
  const rawAllowedOrigins = String(env.ALLOWED_ORIGINS ?? "");
  const siteUrl = String(env.SITE_URL ?? "");

  for (const source of [rawAllowedOrigins, siteUrl]) {
    for (const token of source.split(",")) {
      const candidate = token.trim();
      if (!candidate) continue;
      try {
        origins.add(new URL(candidate).origin);
      } catch {
        // ignore malformed origin entries
      }
    }
  }

  return origins;
}

export function hasAllowedOrigin(request: Request, env: Record<string, unknown>) {
  const allowedOrigins = collectAllowedOrigins(env);
  if (allowedOrigins.size === 0) {
    try {
      allowedOrigins.add(new URL(request.url).origin);
    } catch {
      // ignore malformed request URL
    }
  }
  if (allowedOrigins.size === 0) return true;

  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;

  try {
    const origin = new URL(originHeader).origin;
    return allowedOrigins.has(origin);
  } catch {
    return false;
  }
}

export function clientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim().toLowerCase() || "unknown";
  }

  return (
    headers.get("cf-connecting-ip")?.trim().toLowerCase() ||
    headers.get("x-real-ip")?.trim().toLowerCase() ||
    "unknown"
  );
}

function pruneRateLimitStore(now: number) {
  if (rateLimitStore.size <= RATE_LIMIT_MAX_KEYS) return;
  rateLimitStore.forEach((value, key) => {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}

export function consumeRateLimit(options: {
  bucket: string;
  identifier: string;
  maxRequests: number;
  windowMs: number;
}) {
  const now = Date.now();
  pruneRateLimitStore(now);

  const key = `${options.bucket}:${options.identifier}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      retryAfterSeconds: 0,
    } as const;
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    } as const;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return {
    allowed: true,
    retryAfterSeconds: 0,
  } as const;
}

export async function parseJsonBody<T>(
  request: Request,
  maxBytes: number
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Content-Type must be application/json." }, 415),
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Request body is too large." }, 413),
    };
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Invalid request body." }, 400),
    };
  }

  if (raw.length === 0) {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Request body is required." }, 400),
    };
  }

  const rawBytes = new TextEncoder().encode(raw).length;
  if (rawBytes > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Request body is too large." }, 413),
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: jsonResponse({ success: false, error: "Invalid JSON payload." }, 400),
    };
  }
}

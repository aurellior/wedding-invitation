import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __weddingRateLimitStore?: Map<string, RateLimitEntry>;
};

const store =
  globalForRateLimit.__weddingRateLimitStore ??
  new Map<string, RateLimitEntry>();
globalForRateLimit.__weddingRateLimitStore = store;

/**
 * Extracts client IP address from reverse-proxy / Vercel headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Enforces an in-memory sliding/fixed-window rate limit per IP and namespace.
 */
export function checkRateLimit(
  request: NextRequest,
  options: { namespace: string; limit: number; windowMs: number }
): { allowed: true } | { allowed: false; response: NextResponse } {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${options.namespace}:${ip}`;

  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) {
        store.delete(k);
      }
    }
  }

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (current.count >= options.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: `Terlalu banyak permintaan. Silakan tunggu ${retryAfterSec} detik sebelum mencoba kembali.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      ),
    };
  }

  current.count += 1;
  return { allowed: true };
}

/**
 * Strips script/style blocks, HTML tags, inline event handlers, and dangerous URL protocols
 * to prevent Cross-Site Scripting (XSS) in user-submitted text.
 */
export function sanitizePlainText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:javascript|data|vbscript)\s*:/gi, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escapes a CSV cell and neutralizes formula injection (=, +, -, @, tab, CR).
 */
export function escapeCsvCell(val: string | number | null | undefined): string {
  let str = String(val ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}


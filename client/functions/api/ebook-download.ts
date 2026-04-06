import { Resend } from "resend";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  escapeHtml,
  hasAllowedOrigin,
  jsonResponse,
  normalizeEmail,
  normalizeText,
  parseJsonBody,
} from "./_shared/security";

type EbookDownloadPayload = {
  bookId?: unknown;
  title?: unknown;
  fullName?: unknown;
  email?: unknown;
  downloadPath?: unknown;
  website?: unknown;
};

type AnyRecord = Record<string, unknown>;

const DOWNLOAD_MAX_BODY_BYTES = 24 * 1024;
const DOWNLOAD_IP_MAX_REQUESTS = 10;
const DOWNLOAD_IP_WINDOW_MS = 30 * 60 * 1000;
const DOWNLOAD_EMAIL_MAX_REQUESTS = 5;
const DOWNLOAD_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

function tooManyRequestsResponse(retryAfterSeconds: number) {
  const response = jsonResponse(
    { success: false, error: "Too many requests. Please try again later." },
    429
  );
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

function safeReplySubject(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, 180);
}

function normalizeDownloadPath(value: unknown) {
  const path = normalizeText(value, 240);
  if (!path.startsWith("/")) return "";
  if (!/\.pdf$/i.test(path)) return "";
  return path;
}

function normalizeSiteUrl(siteUrl: string) {
  const trimmed = (siteUrl || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function absoluteUrl(siteUrl: string, path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const base = normalizeSiteUrl(siteUrl);
  if (!base) return path;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Record<string, unknown>;
}) => {
  try {
    const { request, env } = context;

    if (!hasAllowedOrigin(request, env)) {
      return jsonResponse({ success: false, error: "Origin is not allowed." }, 403);
    }

    const body = await parseJsonBody<EbookDownloadPayload>(request, DOWNLOAD_MAX_BODY_BYTES);
    if (body.ok === false) return body.response;
    const data = body.data;

    if (normalizeText(data.website, 120)) {
      return jsonResponse({ success: true }, 200);
    }

    const bookId = normalizeText(String(data.bookId ?? ""), 40);
    const title = normalizeText(data.title, 160);
    const fullName = normalizeText(data.fullName, 120);
    const email = normalizeEmail(data.email);
    const downloadPath = normalizeDownloadPath(data.downloadPath);

    if (!bookId || !title || !fullName || !email || !downloadPath) {
      return jsonResponse({ success: false, error: "Full name and email are required." }, 400);
    }

    const ip = clientIpFromHeaders(request.headers);
    const ipLimit = consumeRateLimit({
      bucket: "ebook-download:ip",
      identifier: ip,
      maxRequests: DOWNLOAD_IP_MAX_REQUESTS,
      windowMs: DOWNLOAD_IP_WINDOW_MS,
    });

    if (!ipLimit.allowed) {
      return tooManyRequestsResponse(ipLimit.retryAfterSeconds);
    }

    const emailLimit = consumeRateLimit({
      bucket: "ebook-download:email",
      identifier: email,
      maxRequests: DOWNLOAD_EMAIL_MAX_REQUESTS,
      windowMs: DOWNLOAD_EMAIL_WINDOW_MS,
    });

    if (!emailLimit.allowed) {
      return tooManyRequestsResponse(emailLimit.retryAfterSeconds);
    }

    const siteUrl = String(env.SITE_URL || "https://charbelabdallah.com");
    const downloadUrl = absoluteUrl(siteUrl, downloadPath);
    const safeTitle = escapeHtml(title);
    const safeFullName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safeDownloadUrl = escapeHtml(downloadUrl);
    const adminText =
      `New free PDF download\n\n` +
      `Book ID: ${bookId}\n` +
      `Book: ${title}\n` +
      `Name: ${fullName}\n` +
      `Email: ${email}\n` +
      `Download link: ${downloadUrl}\n`;

    const buildHtml = (opts: {
      heading: string;
      intro: string;
    }) => `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #eee;border-radius:14px;overflow:hidden;">
          <div style="padding:18px 20px;background:#111;color:#fff;">
            <div style="font-size:16px;font-weight:900;letter-spacing:.2px;">${opts.heading}</div>
            <div style="margin-top:4px;font-size:12px;opacity:.9;">charbelabdallah.com</div>
          </div>

          <div style="padding:20px;">
            <div style="font-size:14px;color:#111;margin-bottom:16px;">${opts.intro}</div>

            <div style="border:1px solid #eee;border-radius:12px;padding:16px;">
              <div style="font-weight:900;margin-bottom:10px;color:#111;">Download details</div>
              <div style="font-size:13px;color:#333;line-height:1.7;">
                <div><strong>Book:</strong> ${safeTitle}</div>
                <div><strong>Name:</strong> ${safeFullName}</div>
                <div><strong>Email:</strong> ${safeEmail}</div>
                <div style="margin-top:10px;"><strong>PDF link:</strong><br/><a href="${safeDownloadUrl}" style="color:#111;text-decoration:underline;">${safeDownloadUrl}</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const adminHtml = buildHtml({
      heading: "New free PDF download",
      intro: "A reader requested a free PDF download from your website.",
    });

    let ownerNotified = false;
    const resendApiKey = String(env.RESEND_API_KEY ?? "").trim();

    if (!resendApiKey) {
      console.warn("[ebook-download] RESEND_API_KEY is not configured. Skipping owner email.");
    } else {
      try {
        const resend = new Resend(resendApiKey);
        const adminSend = await resend.emails.send({
          from: "Downloads <orders@charbelabdallah.com>",
          to: ["charbel_g_abdallah@hotmail.com"],
          subject: safeReplySubject(`New ${title} PDF download`),
          text: adminText,
          html: adminHtml,
        });

        if ((adminSend as AnyRecord)?.error) {
          console.error("[ebook-download] owner email failed:", (adminSend as AnyRecord).error);
        } else {
          ownerNotified = true;
        }
      } catch (sendError) {
        console.error("[ebook-download] owner email request failed:", sendError);
      }
    }

    return jsonResponse(
      {
        success: true,
        downloadUrl,
        ownerNotified,
      },
      200
    );
  } catch (error) {
    console.error("[ebook-download] request failed:", error);
    return jsonResponse(
      { success: false, error: "Could not prepare the download right now. Please try again." },
      500
    );
  }
};

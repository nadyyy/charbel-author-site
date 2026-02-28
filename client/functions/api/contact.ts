import { Resend } from "resend";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  hasAllowedOrigin,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  normalizeMultilineText,
  normalizeText,
  parseJsonBody,
  toHtmlLines,
} from "./_shared/security";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

const CONTACT_MAX_BODY_BYTES = 24 * 1024;
const CONTACT_IP_MAX_REQUESTS = 6;
const CONTACT_IP_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_EMAIL_MAX_REQUESTS = 3;
const CONTACT_EMAIL_WINDOW_MS = 60 * 60 * 1000;

function tooManyRequestsResponse(retryAfterSeconds: number) {
  const response = jsonResponse(
    { success: false, error: "Too many requests. Please try again later." },
    429
  );
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
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

    const body = await parseJsonBody<ContactPayload>(request, CONTACT_MAX_BODY_BYTES);
    if (body.ok === false) return body.response;
    const data = body.data;

    // Honeypot: silently accept bot submissions without sending email.
    if (normalizeText(data.website, 120)) {
      return jsonResponse({ success: true }, 200);
    }

    const resendApiKey = String(env.RESEND_API_KEY ?? "").trim();
    if (!resendApiKey) {
      console.error("[contact] RESEND_API_KEY is not configured.");
      return jsonResponse({ success: false, error: "Service is temporarily unavailable." }, 503);
    }

    const name = normalizeText(data.name, 80);
    const email = normalizeEmail(data.email);
    const message = normalizeMultilineText(data.message, 3000);

    if (!name || !email || !message) {
      return jsonResponse({ success: false, error: "All fields are required." }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, error: "A valid email is required." }, 400);
    }

    const ip = clientIpFromHeaders(request.headers);
    const ipLimit = consumeRateLimit({
      bucket: "contact:ip",
      identifier: ip,
      maxRequests: CONTACT_IP_MAX_REQUESTS,
      windowMs: CONTACT_IP_WINDOW_MS,
    });

    if (!ipLimit.allowed) {
      return tooManyRequestsResponse(ipLimit.retryAfterSeconds);
    }

    const emailLimit = consumeRateLimit({
      bucket: "contact:email",
      identifier: email,
      maxRequests: CONTACT_EMAIL_MAX_REQUESTS,
      windowMs: CONTACT_EMAIL_WINDOW_MS,
    });

    if (!emailLimit.allowed) {
      return tooManyRequestsResponse(emailLimit.retryAfterSeconds);
    }

    const resend = new Resend(resendApiKey);
    const safeName = toHtmlLines(name);
    const safeEmail = toHtmlLines(email);
    const safeMessage = toHtmlLines(message);

    const admin = await resend.emails.send({
      from: "Website Contact <orders@charbelabdallah.com>",
      to: ["charbel_g_abdallah@hotmail.com"],
      subject: `New Contact Message from ${name}`,
      replyTo: email,
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-line;">${safeMessage}</p>
        </div>
      `,
    });

    if ((admin as any)?.error) {
      return jsonResponse(
        { success: false, error: "Could not send your message right now." },
        502
      );
    }

    const confirmation = await resend.emails.send({
      from: "Charbel Abdallah <orders@charbelabdallah.com>",
      to: [email],
      subject: "We received your message",
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h2>Hi ${safeName},</h2>
          <p>Thank you for reaching out.</p>
          <p>We received your message and will respond within 2–3 business days.</p>
          <hr />
          <p><strong>Your message:</strong></p>
          <p style="white-space:pre-line;">${safeMessage}</p>
          <br/>
          <p>— Charbel Abdallah</p>
        </div>
      `,
    });

    if ((confirmation as any)?.error) {
      return jsonResponse(
        { success: false, error: "Could not send your message right now." },
        502
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("[contact] request failed:", error);
    return jsonResponse({ success: false, error: "Failed to process request." }, 500);
  }
};

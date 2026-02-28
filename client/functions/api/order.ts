import { Resend } from "resend";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  escapeHtml,
  hasAllowedOrigin,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  normalizeText,
  parseJsonBody,
} from "./_shared/security";

type AnyRecord = Record<string, unknown>;

type NormalizedOrderItem = {
  id: string;
  title: string;
  quantity: number;
  price: number;
  image: string;
  kind: "book" | "accessory";
  isGift: boolean;
  parentId: string | null;
};

const ORDER_MAX_BODY_BYTES = 128 * 1024;
const ORDER_IP_MAX_REQUESTS = 10;
const ORDER_IP_WINDOW_MS = 30 * 60 * 1000;
const ORDER_EMAIL_MAX_REQUESTS = 5;
const ORDER_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ORDER_ITEMS = 100;

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s);
}

function normalizeSiteUrl(siteUrl: string) {
  const trimmed = (siteUrl || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function normalizeImagePath(image: unknown) {
  if (typeof image !== "string") return "";
  const trimmed = image.trim();
  if (!trimmed) return "";
  if (isHttpUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return "";
}

function absoluteImageUrl(siteUrl: string, image: string) {
  if (!image) return "";
  if (isHttpUrl(image)) return image;

  const base = normalizeSiteUrl(siteUrl);
  if (!base) return "";
  return image.startsWith("/") ? `${base}${image}` : `${base}/${image}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function moneyString(value: number) {
  return roundMoney(value).toFixed(2);
}

function baseIdOf(rawId: unknown) {
  return String(rawId ?? "").split("::")[0];
}

function isBookLine(item: NormalizedOrderItem) {
  if (item.isGift) return false;
  if (item.kind !== "book") return false;
  const base = baseIdOf(item.id);
  return /^\d+$/.test(base);
}

function isGiftLine(item: NormalizedOrderItem) {
  return item.isGift;
}

function normalizeQuantity(value: unknown) {
  const raw = Number(value);
  if (!Number.isInteger(raw)) return 0;
  if (raw < 1 || raw > 20) return 0;
  return raw;
}

function normalizePrice(value: unknown) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  if (raw < 0 || raw > 10_000) return 0;
  return roundMoney(raw);
}

function normalizeOrderItem(raw: unknown): NormalizedOrderItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as AnyRecord;
  const id = normalizeText(item.id, 128);
  const title = normalizeText(item.title, 120);
  const quantity = normalizeQuantity(item.quantity);
  const image = normalizeImagePath(item.image);
  const isGift = item.isGift === true;
  const kind = item.kind === "accessory" ? "accessory" : "book";
  const parentIdRaw = normalizeText(item.parentId, 128);

  if (!id || !title || quantity <= 0) {
    return null;
  }

  return {
    id,
    title,
    quantity,
    price: isGift ? 0 : normalizePrice(item.price),
    image,
    kind,
    isGift,
    parentId: parentIdRaw || null,
  };
}

function computeDeliveryCost(deliveryMethod: "pickup" | "shipping", governorate: string) {
  if (deliveryMethod === "pickup") return 0;
  return governorate === "North Lebanon" ? 3 : 5;
}

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

function safeMultilineHtml(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br/>");
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

    const body = await parseJsonBody<AnyRecord>(request, ORDER_MAX_BODY_BYTES);
    if (body.ok === false) return body.response;
    const data = body.data;

    // Honeypot: bots often fill hidden fields.
    if (normalizeText(data.website, 120)) {
      return jsonResponse({ success: true }, 200);
    }

    const resendApiKey = String(env.RESEND_API_KEY ?? "").trim();
    if (!resendApiKey) {
      console.error("[order] RESEND_API_KEY is not configured.");
      return jsonResponse({ success: false, error: "Service is temporarily unavailable." }, 503);
    }

    const customerEmail = normalizeEmail(data.email);
    if (!isValidEmail(customerEmail)) {
      return jsonResponse({ success: false, error: "A valid email is required." }, 400);
    }

    const firstName = normalizeText(data.firstName, 80);
    const lastName = normalizeText(data.lastName, 80);
    const phone = normalizeText(data.phone, 32);
    if (!firstName || !lastName || !phone) {
      return jsonResponse(
        { success: false, error: "First name, last name, and phone are required." },
        400
      );
    }
    if (!/^[0-9+()\-\s]{6,24}$/.test(phone)) {
      return jsonResponse({ success: false, error: "Phone number format is invalid." }, 400);
    }

    const deliveryMethodRaw = normalizeText(data.deliveryMethod, 24).toLowerCase();
    const deliveryMethod =
      deliveryMethodRaw === "pickup"
        ? "pickup"
        : deliveryMethodRaw === "shipping"
          ? "shipping"
          : null;

    if (!deliveryMethod) {
      return jsonResponse({ success: false, error: "Delivery method is invalid." }, 400);
    }

    const governorate = normalizeText(data.governorate, 80);
    const city = normalizeText(data.city, 120);
    const address = normalizeText(data.address, 240);

    if (deliveryMethod === "shipping" && (!governorate || !city || !address)) {
      return jsonResponse(
        { success: false, error: "Governorate, city, and address are required for delivery." },
        400
      );
    }

    const rawItems = Array.isArray(data.items) ? data.items.slice(0, MAX_ORDER_ITEMS) : [];
    if (rawItems.length === 0) {
      return jsonResponse({ success: false, error: "At least one order item is required." }, 400);
    }

    const items = rawItems
      .map(item => normalizeOrderItem(item))
      .filter((item): item is NormalizedOrderItem => item !== null);

    if (items.length === 0) {
      return jsonResponse({ success: false, error: "Order items are invalid." }, 400);
    }

    const ip = clientIpFromHeaders(request.headers);
    const ipLimit = consumeRateLimit({
      bucket: "order:ip",
      identifier: ip,
      maxRequests: ORDER_IP_MAX_REQUESTS,
      windowMs: ORDER_IP_WINDOW_MS,
    });
    if (!ipLimit.allowed) {
      return tooManyRequestsResponse(ipLimit.retryAfterSeconds);
    }

    const emailLimit = consumeRateLimit({
      bucket: "order:email",
      identifier: customerEmail,
      maxRequests: ORDER_EMAIL_MAX_REQUESTS,
      windowMs: ORDER_EMAIL_WINDOW_MS,
    });
    if (!emailLimit.allowed) {
      return tooManyRequestsResponse(emailLimit.retryAfterSeconds);
    }

    const siteUrl = String(env.SITE_URL || "https://charbelabdallah.com");
    const deliveryCost = roundMoney(computeDeliveryCost(deliveryMethod, governorate));
    const subtotal = roundMoney(
      items
        .filter(item => !item.isGift)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
    const total = roundMoney(subtotal + deliveryCost);

    const deliveryLine = deliveryMethod === "pickup" ? "Pickup (Free)" : "Delivery";
    const regionLine = deliveryMethod === "pickup" ? "-" : governorate || "-";
    const cityLine = deliveryMethod === "pickup" ? "-" : city || "-";
    const addressLine = deliveryMethod === "pickup" ? "-" : address || "-";

    const groupedBooks = (() => {
      const map = new Map<
        string,
        {
          baseId: string;
          title: string;
          unitPrice: number;
          image: string;
          qty: number;
          gifts: Map<string, { title: string; image: string; qty: number }>;
        }
      >();

      for (const item of items) {
        if (!isBookLine(item)) continue;
        const baseId = baseIdOf(item.id);
        const existing =
          map.get(baseId) ?? {
            baseId,
            title: item.title,
            unitPrice: item.price,
            image: item.image,
            qty: 0,
            gifts: new Map(),
          };
        existing.qty += item.quantity;
        map.set(baseId, existing);
      }

      for (const item of items) {
        if (!isGiftLine(item) || !item.parentId) continue;
        const baseId = baseIdOf(item.parentId);
        const parent = map.get(baseId);
        if (!parent) continue;
        const key = item.title;
        const gift = parent.gifts.get(key) ?? { title: key, image: item.image, qty: 0 };
        gift.qty += item.quantity;
        parent.gifts.set(key, gift);
      }

      return Array.from(map.values()).sort((a, b) => {
        const an = parseInt(a.baseId, 10);
        const bn = parseInt(b.baseId, 10);
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
        return a.baseId.localeCompare(b.baseId);
      });
    })();

    const accessoryLines = items.filter(item => {
      if (item.isGift) return false;
      const base = baseIdOf(item.id);
      return item.kind === "accessory" || !/^\d+$/.test(base);
    });

    const lines: string[] = [];
    for (const b of groupedBooks) {
      lines.push(`• ${b.title} × ${b.qty} = $${moneyString(b.unitPrice * b.qty)}`);
      for (const gift of Array.from(b.gifts.values())) {
        lines.push(`   - ${gift.title} × ${gift.qty} = FREE (FREE GIFT)`);
      }
    }
    for (const a of accessoryLines) {
      lines.push(
        `• ${a.title} × ${a.quantity} = $${moneyString(a.price * a.quantity)}`
      );
    }
    const itemsText = lines.join("\n");

    const fullName = `${firstName} ${lastName}`.trim();
    const safeFullName = escapeHtml(fullName);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(customerEmail);
    const safeRegionLine = escapeHtml(regionLine);
    const safeCityLine = escapeHtml(cityLine);
    const safeAddressLine = safeMultilineHtml(addressLine);

    const adminText =
      `New Order\n\n` +
      `Name: ${fullName}\n` +
      `Phone: ${phone}\n` +
      `Email: ${customerEmail}\n\n` +
      `Delivery: ${deliveryLine}\n` +
      `Region: ${regionLine}\n` +
      `City: ${cityLine}\n` +
      `Address: ${addressLine}\n\n` +
      `Order:\n${itemsText || "(no items)"}\n\n` +
      `Subtotal: $${moneyString(subtotal)}\n` +
      `Delivery: $${moneyString(deliveryCost)}\n` +
      `Total: $${moneyString(total)}\n`;

    const customerText =
      `Hi ${firstName},\n\n` +
      `Thanks, we received your order.\n\n` +
      `Order:\n${itemsText || "(no items)"}\n\n` +
      `Subtotal: $${moneyString(subtotal)}\n` +
      `Delivery: $${moneyString(deliveryCost)}\n` +
      `Total: $${moneyString(total)}\n\n` +
      `${
        deliveryMethod === "pickup"
          ? "We’ll contact you shortly to confirm pickup details."
          : "We’ll contact you shortly to confirm delivery details."
      }\n\n` +
      "— Charbel Abdallah\n";

    const rowsHtmlParts: string[] = [];
    for (const b of groupedBooks) {
      const bookImg = absoluteImageUrl(siteUrl, b.image);
      rowsHtmlParts.push(`
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;width:64px;vertical-align:top;">
            ${
              bookImg
                ? `<img src="${escapeHtml(bookImg)}" alt="${escapeHtml(b.title)}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;" />`
                : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
            }
          </td>
          <td style="padding:12px 12px 12px 0;vertical-align:top;">
            <div style="font-weight:800;color:#111;font-size:14px;line-height:1.2;">
              ${escapeHtml(b.title)}
            </div>
            <div style="margin-top:6px;color:#444;font-size:13px;">Qty: ${b.qty}</div>
          </td>
          <td style="padding:12px 0;vertical-align:top;text-align:right;font-weight:800;color:#111;font-size:14px;">
            $${moneyString(b.unitPrice * b.qty)}
          </td>
        </tr>
      `);

      for (const gift of Array.from(b.gifts.values())) {
        const giftImg = absoluteImageUrl(siteUrl, gift.image);
        rowsHtmlParts.push(`
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 0 10px 0;width:64px;vertical-align:top;">
              ${
                giftImg
                  ? `<img src="${escapeHtml(giftImg)}" alt="${escapeHtml(gift.title)}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;opacity:.95;" />`
                  : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
              }
            </td>
            <td style="padding:10px 12px 10px 0;vertical-align:top;">
              <div style="font-weight:800;color:#111;font-size:13px;line-height:1.2;">
                ${escapeHtml(gift.title)}
                <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#f6f1d4;color:#8a6d1f;font-size:12px;font-weight:800;vertical-align:middle;">FREE GIFT</span>
              </div>
              <div style="margin-top:6px;color:#444;font-size:12px;">Qty: ${gift.qty}</div>
            </td>
            <td style="padding:10px 0;vertical-align:top;text-align:right;font-weight:800;color:#111;font-size:13px;">
              FREE
            </td>
          </tr>
        `);
      }
    }

    for (const a of accessoryLines) {
      const aImg = absoluteImageUrl(siteUrl, a.image);
      rowsHtmlParts.push(`
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;width:64px;vertical-align:top;">
            ${
              aImg
                ? `<img src="${escapeHtml(aImg)}" alt="${escapeHtml(a.title)}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;" />`
                : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
            }
          </td>
          <td style="padding:12px 12px 12px 0;vertical-align:top;">
            <div style="font-weight:800;color:#111;font-size:14px;line-height:1.2;">
              ${escapeHtml(a.title)}
            </div>
            <div style="margin-top:6px;color:#444;font-size:13px;">Qty: ${a.quantity}</div>
          </td>
          <td style="padding:12px 0;vertical-align:top;text-align:right;font-weight:800;color:#111;font-size:14px;">
            $${moneyString(a.price * a.quantity)}
          </td>
        </tr>
      `);
    }

    const rowsHtml = rowsHtmlParts.join("");

    const buildHtml = (opts: {
      heading: string;
      intro: string;
      includeContactLine: boolean;
    }) => `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #eee;border-radius:14px;overflow:hidden;">
          <div style="padding:18px 20px;background:#111;color:#fff;">
            <div style="font-size:16px;font-weight:900;letter-spacing:.2px;">${opts.heading}</div>
            <div style="margin-top:4px;font-size:12px;opacity:.9;">charbelabdallah.com</div>
          </div>

          <div style="padding:20px;">
            <div style="font-size:14px;color:#111;margin-bottom:10px;">${opts.intro}</div>

            <div style="border:1px solid #eee;border-radius:12px;padding:16px;">
              <div style="font-weight:900;margin-bottom:10px;color:#111;">Order summary</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                ${rowsHtml || `<tr><td style="padding:12px 0;color:#666;">(no items)</td></tr>`}
              </table>

              <div style="margin-top:14px;border-top:1px solid #eee;padding-top:12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-size:13px;color:#333;padding:6px 0;">Subtotal:</td>
                    <td align="right" style="font-size:13px;color:#333;padding:6px 0;">$${moneyString(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#333;padding:6px 0;">Delivery:</td>
                    <td align="right" style="font-size:13px;color:#333;padding:6px 0;">$${moneyString(deliveryCost)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:15px;color:#111;font-weight:900;padding:10px 0 0;">Total:</td>
                    <td align="right" style="font-size:15px;color:#111;font-weight:900;padding:10px 0 0;">$${moneyString(total)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div style="margin-top:16px;border:1px solid #eee;border-radius:12px;padding:16px;">
              <div style="font-weight:900;margin-bottom:10px;color:#111;">Customer details</div>
              <div style="font-size:13px;color:#333;line-height:1.6;">
                <div><strong>Name:</strong> ${safeFullName}</div>
                <div><strong>Phone:</strong> ${safePhone}</div>
                <div><strong>Email:</strong> ${safeEmail}</div>
                <div style="margin-top:10px;"><strong>Delivery:</strong> ${escapeHtml(deliveryLine)}</div>
                <div><strong>Region:</strong> ${safeRegionLine}</div>
                <div><strong>City:</strong> ${safeCityLine}</div>
                <div><strong>Address:</strong> ${safeAddressLine}</div>
              </div>
            </div>

            ${
              opts.includeContactLine
                ? `<div style="margin-top:16px;color:#444;font-size:13px;line-height:1.6;">
                    ${
                      deliveryMethod === "pickup"
                        ? `We’ll contact you shortly to confirm <strong>pickup</strong> details.`
                        : `We’ll contact you shortly to confirm <strong>delivery</strong> details.`
                    }
                  </div>`
                : ``
            }
          </div>
        </div>
      </div>
    `;

    const adminHtml = buildHtml({
      heading: "New order received",
      intro: "A new order was placed on your website.",
      includeContactLine: false,
    });

    const customerHtml = buildHtml({
      heading: "Order received",
      intro: `Hi ${escapeHtml(firstName)},<br><br>Thanks, we received your order.`,
      includeContactLine: true,
    });

    const resend = new Resend(resendApiKey);
    const adminSend = await resend.emails.send({
      from: "Orders <orders@charbelabdallah.com>",
      to: ["charbel_g_abdallah@hotmail.com"],
      subject: safeReplySubject("New Order"),
      text: adminText,
      html: adminHtml,
      replyTo: customerEmail,
    });

    if ((adminSend as AnyRecord)?.error) {
      return jsonResponse(
        { success: false, error: "Could not place order right now. Please try again." },
        502
      );
    }

    const customerSend = await resend.emails.send({
      from: "Charbel Abdallah <orders@charbelabdallah.com>",
      to: [customerEmail],
      subject: safeReplySubject("Order received"),
      text: customerText,
      html: customerHtml,
    });

    if ((customerSend as AnyRecord)?.error) {
      return jsonResponse(
        { success: false, error: "Could not place order right now. Please try again." },
        502
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("[order] request failed:", error);
    return jsonResponse(
      { success: false, error: "Could not place order right now. Please try again." },
      500
    );
  }
};

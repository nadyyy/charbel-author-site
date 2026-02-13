import { Resend } from "resend";

type AnyRecord = Record<string, any>;

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s);
}

function normalizeSiteUrl(siteUrl: string) {
  const trimmed = (siteUrl || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function absoluteImageUrl(siteUrl: string, image: string | undefined | null) {
  const img = (image || "").trim();
  if (!img) return "";
  if (isHttpUrl(img)) return img;

  const base = normalizeSiteUrl(siteUrl);
  if (!base) return img; // fallback (won't show image in most clients if relative)
  return img.startsWith("/") ? `${base}${img}` : `${base}/${img}`;
}

function money(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return String(v);
}

function baseIdOf(rawId: any) {
  return String(rawId ?? "").split("::")[0];
}

function isBookLine(i: AnyRecord) {
  if (i?.isGift) return false;
  if ((i?.kind ?? "book") !== "book") return false;
  const base = baseIdOf(i.id);
  return /^\d+$/.test(base); // numeric = real book
}

function isGiftLine(i: AnyRecord) {
  return i?.isGift === true;
}

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const data: AnyRecord = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    // REQUIRED customer email
    const customerEmailRaw = typeof data.email === "string" ? data.email.trim() : "";
    const customerEmail =
      customerEmailRaw.includes("@") && customerEmailRaw.toLowerCase().endsWith(".com")
        ? customerEmailRaw
        : null;

    if (!customerEmail) {
      return new Response(JSON.stringify({ success: false, error: "Valid .com email is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const siteUrl = env.SITE_URL || "https://charbelabdallah.com";

    const items: AnyRecord[] = Array.isArray(data.items) ? data.items : [];

    // Lookup by id for gift parent
    const byId = new Map<string, AnyRecord>();
    for (const it of items) {
      if (it?.id != null) byId.set(String(it.id), it);
    }

    // Totals
    const subtotal = Number(data.subtotal ?? 0);
    const deliveryCost = Number(data.deliveryCost ?? 0);
    const total = Number(data.total ?? subtotal + deliveryCost);

    const deliveryMethod = String(data.deliveryMethod || "").toLowerCase(); // pickup | shipping
    const isPickup = deliveryMethod === "pickup";

    const deliveryLine = isPickup ? "Pickup (Free)" : "Delivery";
    const regionLine = isPickup ? "-" : (data.governorate || "-");
    const cityLine = isPickup ? "-" : (data.city || "-");
    const addressLine = isPickup ? "-" : (data.address || "-");

    // ---------- Group items for nicer email (books aggregated + gifts under them) ----------
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

      // books
      for (const i of items) {
        if (!isBookLine(i)) continue;

        const baseId = baseIdOf(i.id);
        const g =
          map.get(baseId) ?? {
            baseId,
            title: String(i.title || ""),
            unitPrice: Number(i.price || 0),
            image: String(i.image || ""),
            qty: 0,
            gifts: new Map(),
          };

        g.qty += Number(i.quantity || 0);
        map.set(baseId, g);
      }

      // gifts
      for (const i of items) {
        if (!isGiftLine(i)) continue;
        if (!i.parentId) continue;

        const baseId = baseIdOf(i.parentId);
        const g = map.get(baseId);
        if (!g) continue;

        const key = String(i.title || "");
        const existing = g.gifts.get(key) ?? { title: key, image: String(i.image || ""), qty: 0 };
        existing.qty += Number(i.quantity || 0);
        g.gifts.set(key, existing);
      }

      return Array.from(map.values()).sort((a, b) => {
        const an = parseInt(a.baseId, 10);
        const bn = parseInt(b.baseId, 10);
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
        return a.baseId.localeCompare(b.baseId);
      });
    })();

    const accessoryLines = items.filter((i: AnyRecord) => {
      if (i?.isGift) return false;
      const base = baseIdOf(i.id);
      return (i?.kind === "accessory") || !/^\d+$/.test(base);
    });

    // ---------- TEXT version ----------
    const lines: string[] = [];

    for (const b of groupedBooks) {
      lines.push(`• ${b.title} × ${b.qty} = $${b.unitPrice * b.qty}`);
      for (const gift of Array.from(b.gifts.values())) {
        lines.push(`   - ${gift.title} × ${gift.qty} = FREE (FREE GIFT)`);
      }
    }

    for (const a of accessoryLines) {
      const qty = Number(a.quantity || 0);
      const unit = Number(a.price || 0);
      lines.push(`• ${String(a.title || "")} × ${qty} = $${unit * qty}`);
    }

    const itemsText = lines.join("\n");

    // ADMIN text (NO “we’ll contact…”)
    const adminText =
`New Order

Name: ${data.firstName ?? ""} ${data.lastName ?? ""}
Phone: ${data.phone ?? "-"}
Email: ${customerEmail}

Delivery: ${deliveryLine}
Region: ${regionLine}
City: ${cityLine}
Address: ${addressLine}

Order:
${itemsText || "(no items)"}

Subtotal: $${money(subtotal)}
Delivery: $${money(deliveryCost)}
Total: $${money(total)}
`;

    // CUSTOMER text (Hi there, no emoji)
    const customerText =
`Hi there,

Thanks, we received your order.

Order:
${itemsText || "(no items)"}

Subtotal: $${money(subtotal)}
Delivery: $${money(deliveryCost)}
Total: $${money(total)}

${isPickup ? "We’ll contact you shortly to confirm pickup details." : "We’ll contact you shortly to confirm delivery details."}

— Charbel Abdallah
`;

    // ---------- HTML rows ----------
    const rowsHtmlParts: string[] = [];

    for (const b of groupedBooks) {
      const bookImg = absoluteImageUrl(siteUrl, b.image);
      const bookTotal = `$${b.unitPrice * b.qty}`;

      rowsHtmlParts.push(`
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;width:64px;vertical-align:top;">
            ${
              bookImg
                ? `<img src="${bookImg}" alt="${b.title}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;" />`
                : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
            }
          </td>
          <td style="padding:12px 12px 12px 0;vertical-align:top;">
            <div style="font-weight:800;color:#111;font-size:14px;line-height:1.2;">
              ${b.title}
            </div>
            <div style="margin-top:6px;color:#444;font-size:13px;">Qty: ${b.qty}</div>
          </td>
          <td style="padding:12px 0;vertical-align:top;text-align:right;font-weight:800;color:#111;font-size:14px;">
            ${bookTotal}
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
                  ? `<img src="${giftImg}" alt="${gift.title}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;opacity:.95;" />`
                  : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
              }
            </td>
            <td style="padding:10px 12px 10px 0;vertical-align:top;">
              <div style="font-weight:800;color:#111;font-size:13px;line-height:1.2;">
                ${gift.title}
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
      const qty = Number(a.quantity || 0);
      const unit = Number(a.price || 0);
      const lineTotal = `$${unit * qty}`;
      const aImg = absoluteImageUrl(siteUrl, a.image);
      const title = String(a.title || "");

      rowsHtmlParts.push(`
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:12px 0;width:64px;vertical-align:top;">
            ${
              aImg
                ? `<img src="${aImg}" alt="${title}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;" />`
                : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
            }
          </td>
          <td style="padding:12px 12px 12px 0;vertical-align:top;">
            <div style="font-weight:800;color:#111;font-size:14px;line-height:1.2;">
              ${title}
            </div>
            <div style="margin-top:6px;color:#444;font-size:13px;">Qty: ${qty}</div>
          </td>
          <td style="padding:12px 0;vertical-align:top;text-align:right;font-weight:800;color:#111;font-size:14px;">
            ${lineTotal}
          </td>
        </tr>
      `);
    }

    const rowsHtml = rowsHtmlParts.join("");

    // Common block builder — we control whether to include the “contact” line
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
                <div style="display:flex;justify-content:space-between;font-size:13px;color:#333;margin:6px 0;">
                  <span>Subtotal</span><span>$${money(subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;color:#333;margin:6px 0;">
                  <span>Delivery</span><span>$${money(deliveryCost)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:15px;color:#111;font-weight:900;margin-top:10px;">
                  <span>Total</span><span>$${money(total)}</span>
                </div>
              </div>
            </div>

            <div style="margin-top:16px;border:1px solid #eee;border-radius:12px;padding:16px;">
              <div style="font-weight:900;margin-bottom:10px;color:#111;">Customer details</div>
              <div style="font-size:13px;color:#333;line-height:1.6;">
                <div><strong>Name:</strong> ${data.firstName ?? ""} ${data.lastName ?? ""}</div>
                <div><strong>Phone:</strong> ${data.phone ?? "-"}</div>
                <div><strong>Email:</strong> ${customerEmail}</div>
                <div style="margin-top:10px;"><strong>Delivery:</strong> ${deliveryLine}</div>
                <div><strong>Region:</strong> ${regionLine}</div>
                <div><strong>City:</strong> ${cityLine}</div>
                <div><strong>Address:</strong> ${addressLine}</div>
              </div>
            </div>

            ${
              opts.includeContactLine
                ? `<div style="margin-top:16px;color:#444;font-size:13px;line-height:1.6;">
                    ${isPickup
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
      includeContactLine: false, // ✅ admin should NOT have it
    });

    const customerHtml = buildHtml({
      heading: "Order received",
      intro: "Hi there, thanks, we received your order.",
      includeContactLine: true, // ✅ customer keeps it
    });

    // 1) Admin email
    const adminSend = await resend.emails.send({
      from: "Orders <orders@charbelabdallah.com>",
      to: ["charbel_g_abdallah@hotmail.com"],
      subject: "New Order",
      text: adminText,
      html: adminHtml,
      replyTo: customerEmail,
    });

    if ((adminSend as any)?.error) {
      const msg = (adminSend as any).error?.message ?? "Admin email failed";
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Customer email
    const customerSend = await resend.emails.send({
      from: "Charbel Abdallah <orders@charbelabdallah.com>",
      to: [customerEmail],
      subject: "Order received",
      text: customerText,
      html: customerHtml,
    });

    if ((customerSend as any)?.error) {
      const msg = (customerSend as any).error?.message ?? "Customer email failed";
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        adminId: (adminSend as any)?.data?.id ?? null,
        customerId: (customerSend as any)?.data?.id ?? null,
        customerEmailSentTo: customerEmail,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message ?? "Failed to send order" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

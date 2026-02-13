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
  if (!base) return img; // fallback: return relative if SITE_URL missing
  return img.startsWith("/") ? `${base}${img}` : `${base}/${img}`;
}

function money(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return String(v);
}

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const data: AnyRecord = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    // REQUIRED customer email (you wanted mandatory)
    const customerEmailRaw = typeof data.email === "string" ? data.email.trim() : "";
    const customerEmail =
      customerEmailRaw.includes("@") && customerEmailRaw.toLowerCase().endsWith(".com")
        ? customerEmailRaw
        : null;

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid .com email is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const siteUrl = env.SITE_URL || "https://charbelabdallah.com";

    const items: AnyRecord[] = Array.isArray(data.items) ? data.items : [];

    // Map for parent title lookup (for gifts)
    const byId = new Map<string, AnyRecord>();
    for (const it of items) {
      if (it?.id != null) byId.set(String(it.id), it);
    }

    // Totals
    const subtotal = Number(data.subtotal ?? 0);
    const deliveryCost = Number(data.deliveryCost ?? 0);
    const total = Number(data.total ?? subtotal + deliveryCost);

    const deliveryMethod = String(data.deliveryMethod || "").toLowerCase(); // "pickup" or "shipping"
    const isPickup = deliveryMethod === "pickup";

    const deliveryLine = isPickup ? "Pickup (Free)" : "Delivery";
    const regionLine = isPickup ? "Pickup" : (data.governorate || "-");
    const cityLine = isPickup ? "-" : (data.city || "-");
    const addressLine = isPickup ? "-" : (data.address || "-");

    // ---------- TEXT (admin + customer fallback) ----------
    const itemsText = items
      .map((i: AnyRecord) => {
        const qty = Number(i.quantity || 0);
        const unit = Number(i.price || 0);
        const lineTotal = i.isGift ? "FREE" : `$${unit * qty}`;
        const giftTag = i.isGift ? " (FREE GIFT)" : "";
        const parent =
          i.isGift && i.parentId ? byId.get(String(i.parentId))?.title : null;
        const parentTag = parent ? ` for "${parent}"` : "";
        return `• ${i.title} × ${qty} = ${lineTotal}${giftTag}${parentTag}`;
      })
      .join("\n");

    const adminText =
`New Order

Name: ${data.firstName ?? ""} ${data.lastName ?? ""}
Phone: ${data.phone ?? "-"}
Email: ${customerEmail ?? "-"}

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

    const customerText =
`Hi ${data.firstName ?? "there"},

Thanks — we received your order ✅

Order:
${itemsText || "(no items)"}

Subtotal: $${money(subtotal)}
Delivery: $${money(deliveryCost)}
Total: $${money(total)}

${isPickup ? "We’ll contact you shortly to confirm pickup details." : "We’ll contact you shortly to confirm delivery details."}

— Charbel Abdallah
`;

    // ---------- HTML email with images ----------
    const rowsHtml = items
      .map((i: AnyRecord) => {
        const qty = Number(i.quantity || 0);
        const unit = Number(i.price || 0);
        const isGift = !!i.isGift;
        const totalCell = isGift ? "FREE" : `$${unit * qty}`;

        const imgUrl = absoluteImageUrl(siteUrl, i.image);
        const title = String(i.title || "");
        const parent =
          isGift && i.parentId ? byId.get(String(i.parentId))?.title : null;

        const giftBadge = isGift
          ? `<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#f6f1d4;color:#8a6d1f;font-size:12px;font-weight:700;vertical-align:middle;">FREE GIFT</span>`
          : "";

        const parentLine = parent
          ? `<div style="margin-top:4px;color:#666;font-size:12px;">Gift for: <strong>${String(parent)}</strong></div>`
          : "";

        return `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 0;width:64px;vertical-align:top;">
              ${
                imgUrl
                  ? `<img src="${imgUrl}" alt="${title}" width="56" height="56" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;" />`
                  : `<div style="width:56px;height:56px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
              }
            </td>
            <td style="padding:12px 12px 12px 0;vertical-align:top;">
              <div style="font-weight:700;color:#111;font-size:14px;line-height:1.2;">
                ${title}
                ${giftBadge}
              </div>
              <div style="margin-top:6px;color:#444;font-size:13px;">Qty: ${qty}</div>
              ${parentLine}
            </td>
            <td style="padding:12px 0;vertical-align:top;text-align:right;font-weight:700;color:#111;font-size:14px;">
              ${totalCell}
            </td>
          </tr>
        `;
      })
      .join("");

    const commonHtml = (heading: string, introLine: string) => `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f7f7;padding:24px;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #eee;border-radius:14px;overflow:hidden;">
          <div style="padding:18px 20px;background:#111;color:#fff;">
            <div style="font-size:16px;font-weight:800;letter-spacing:.2px;">${heading}</div>
            <div style="margin-top:4px;font-size:12px;opacity:.9;">charbelabdallah.com</div>
          </div>

          <div style="padding:20px;">
            <div style="font-size:14px;color:#111;margin-bottom:10px;">${introLine}</div>

            <div style="border:1px solid #eee;border-radius:12px;padding:16px;">
              <div style="font-weight:800;margin-bottom:10px;color:#111;">Order summary</div>
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
              <div style="font-weight:800;margin-bottom:10px;color:#111;">Customer details</div>
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

            <div style="margin-top:16px;color:#444;font-size:13px;line-height:1.6;">
              ${
                isPickup
                  ? `We’ll contact you shortly to confirm <strong>pickup</strong> details.`
                  : `We’ll contact you shortly to confirm <strong>delivery</strong> details.`
              }
            </div>

            <div style="margin-top:22px;color:#999;font-size:12px;">
              If images don’t load, it’s usually because the email client is blocking remote images — you can allow images for this sender.
            </div>
          </div>
        </div>
      </div>
    `;

    const adminHtml = commonHtml(
      "New order received ✅",
      `A new order was placed on your website.`
    );

    const customerHtml = commonHtml(
      "Order received ✅",
      `Hi ${data.firstName ?? "there"}, thanks — we received your order.`
    );

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

    // 2) Customer email (mandatory now)
    const customerSend = await resend.emails.send({
      from: "Charbel Abdallah <orders@charbelabdallah.com>",
      to: [customerEmail],
      subject: "Order received ✅",
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
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message ?? "Failed to send order",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

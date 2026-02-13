import { Resend } from "resend";

const escapeHtml = (s: any) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toNumber = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeImageUrl = (raw: any, siteUrl: string) => {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return `${siteUrl}${s}`;
  // if someone stored "accessories/x.jpg" without leading slash:
  return `${siteUrl}/${s}`;
};

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const data = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    // IMPORTANT:
    // - Use SITE_URL if you set it in Cloudflare variables (recommended)
    // - Otherwise default to your live domain
    const siteUrl = (env.SITE_URL || "https://charbelabdallah.com").replace(/\/+$/, "");

    // --- Basic email sanity check ---
    const customerEmail =
      typeof data.email === "string" && data.email.includes("@")
        ? data.email.trim()
        : null;

    const items = Array.isArray(data.items) ? data.items : [];

    const itemsText =
      items.length > 0
        ? items
            .map((i: any) => {
              const qty = toNumber(i.quantity, 0);
              const price = toNumber(i.price, 0);
              const total = price * qty;
              return `• ${i.title} × ${qty} = ${i.isGift ? "FREE" : `$${total}`}`;
            })
            .join("\n")
        : "(no items)";

    const subtotal = toNumber(data.subtotal, 0);
    const deliveryCost = toNumber(data.deliveryCost, 0);
    const total = toNumber(data.total, subtotal + deliveryCost);

    // --- Admin email body (text) ---
    const adminText =
      `
New Order

Name: ${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() +
      `
Phone: ${data.phone ?? "-"}
Email: ${customerEmail ?? "-"}

Delivery: ${data.deliveryMethod ?? "-"}
Region: ${data.governorate || "Pickup"}
City: ${data.city || "-"}
Address: ${data.address || "-"}

Order:
${itemsText}

Subtotal: $${subtotal}
Delivery: $${deliveryCost}
Total: $${total}
`;

    // 1) Send admin notification (always)
    const adminSend = await resend.emails.send({
      from: "Orders <orders@charbelabdallah.com>",
      to: ["charbel_g_abdallah@hotmail.com"],
      subject: "New Order",
      text: adminText,
      replyTo: customerEmail ?? undefined,
    });

    if ((adminSend as any)?.error) {
      const msg = (adminSend as any).error?.message ?? "Admin email failed";
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Send customer confirmation (HTML with images)
    let customerSend: any = null;

    if (customerEmail) {
      const itemsHtml =
        items.length > 0
          ? items
              .map((i: any) => {
                const title = escapeHtml(i.title);
                const qty = toNumber(i.quantity, 0);
                const price = toNumber(i.price, 0);
                const lineTotal = price * qty;
                const priceLabel = i.isGift ? "FREE" : `$${lineTotal}`;
                const badge = i.isGift
                  ? `<span style="display:inline-block;margin-left:8px;font-size:12px;font-weight:700;color:#b8860b;">FREE GIFT</span>`
                  : "";
                const img = normalizeImageUrl(i.image, siteUrl);

                return `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;width:84px;">
    ${
      img
        ? `<img src="${escapeHtml(img)}" alt="${title}" width="72" height="72" style="display:block;object-fit:contain;border:1px solid #eee;border-radius:8px;background:#fff;" />`
        : `<div style="width:72px;height:72px;border:1px solid #eee;border-radius:8px;background:#fafafa;"></div>`
    }
  </td>
  <td style="padding:12px 0 12px 12px;border-bottom:1px solid #eee;vertical-align:top;">
    <div style="font-size:14px;font-weight:700;color:#111;line-height:1.35;">
      ${title}${badge}
    </div>
    <div style="font-size:13px;color:#666;margin-top:4px;">
      Qty: ${qty}
    </div>
  </td>
  <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;text-align:right;white-space:nowrap;font-size:14px;font-weight:700;color:#111;">
    ${escapeHtml(priceLabel)}
  </td>
</tr>
`.trim();
              })
              .join("\n")
          : `<tr><td style="padding:12px 0;color:#666;">(no items)</td></tr>`;

      const customerHtml = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;color:#111;margin:0;padding:0;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="border:1px solid #eee;border-radius:12px;padding:20px;">
      <h2 style="margin:0 0 10px 0;font-size:20px;line-height:1.3;">Order received ✅</h2>
      <p style="margin:0 0 18px 0;color:#444;font-size:14px;line-height:1.6;">
        Hi ${escapeHtml(data.firstName ?? "there")},<br/>
        Thanks — we received your order. Below is your summary.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        ${itemsHtml}
      </table>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#444;font-size:14px;">Subtotal</td>
          <td style="padding:6px 0;color:#111;font-weight:700;font-size:14px;text-align:right;">$${escapeHtml(subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#444;font-size:14px;">Delivery</td>
          <td style="padding:6px 0;color:#111;font-weight:700;font-size:14px;text-align:right;">$${escapeHtml(deliveryCost)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#111;font-size:15px;font-weight:800;border-top:1px solid #eee;">Total</td>
          <td style="padding:10px 0;color:#111;font-size:15px;font-weight:800;text-align:right;border-top:1px solid #eee;">$${escapeHtml(total)}</td>
        </tr>
      </table>

      <p style="margin:18px 0 0 0;color:#444;font-size:14px;line-height:1.6;">
        We’ll contact you shortly to confirm delivery details.
      </p>

      <p style="margin:18px 0 0 0;color:#777;font-size:12px;line-height:1.6;">
        — Charbel Abdallah
      </p>
    </div>

    <div style="text-align:center;color:#888;font-size:12px;margin-top:14px;">
      If you don’t see images, your email client may block them by default.
    </div>
  </div>
</div>
`.trim();

      const customerText = `
Hi ${data.firstName ?? "there"},

Thanks — we received your order ✅

Order:
${itemsText}

Subtotal: $${subtotal}
Delivery: $${deliveryCost}
Total: $${total}

We’ll contact you shortly to confirm delivery details.

— Charbel Abdallah
`.trim();

      customerSend = await resend.emails.send({
        from: "Charbel Abdallah <orders@charbelabdallah.com>",
        to: [customerEmail],
        subject: "Order received ✅",
        html: customerHtml,
        text: customerText, // fallback for clients that block HTML
      });

      if ((customerSend as any)?.error) {
        const msg = (customerSend as any).error?.message ?? "Customer email failed";
        return new Response(JSON.stringify({ success: false, error: msg }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
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
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Failed to send order" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

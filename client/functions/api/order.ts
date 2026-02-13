import { Resend } from "resend";

type AnyObj = Record<string, any>;

const baseIdOf = (raw: any) => String(raw ?? "").split("::")[0];
const isNumericId = (raw: any) => /^\d+$/.test(baseIdOf(raw));

const money = (n: any) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2).replace(/\.00$/, "") : "0";
};

const escapeHtml = (s: any) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeSiteUrl = (v: any) => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
};

const absImageUrl = (siteUrl: string, img: any) => {
  const p = String(img ?? "").trim();
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (!siteUrl) return "";
  return p.startsWith("/") ? `${siteUrl}${p}` : `${siteUrl}/${p}`;
};

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const data: AnyObj = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    // ---- REQUIRED EMAIL (your UI already enforces .com, we enforce too) ----
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

    const siteUrl = normalizeSiteUrl(env.SITE_URL);

    const items = Array.isArray(data.items) ? data.items : [];

    // ---- Split items ----
    const gifts = items.filter((i: AnyObj) => i?.isGift === true);
    const nonGifts = items.filter((i: AnyObj) => i?.isGift !== true);

    // ---- Group non-gifts into: books (numeric ids) + accessories (non-numeric or kind=accessory) ----
    type Group = {
      key: string;
      kind: "book" | "accessory";
      baseId: string;
      title: string;
      image: string;
      unitPrice: number;
      qty: number;
      gifts: Map<string, { title: string; image: string; qty: number }>;
    };

    const grouped = new Map<string, Group>();

    for (const i of nonGifts) {
      const baseId = baseIdOf(i?.id);
      const kind: "book" | "accessory" =
        i?.kind === "accessory" || !isNumericId(i?.id) ? "accessory" : "book";

      const unitPrice = Number(i?.price ?? 0);
      const qty = Number(i?.quantity ?? 0);

      // group key: kind + baseId + title (safe)
      const key = `${kind}::${baseId}::${String(i?.title ?? "")}`;

      const g =
        grouped.get(key) ??
        ({
          key,
          kind,
          baseId,
          title: String(i?.title ?? ""),
          image: String(i?.image ?? ""),
          unitPrice,
          qty: 0,
          gifts: new Map(),
        } as Group);

      g.qty += qty;
      grouped.set(key, g);
    }

    // ---- Attach gifts to parent books by parentId base ----
    for (const gift of gifts) {
      const parentBase = baseIdOf(gift?.parentId);
      if (!parentBase) continue;

      // Find matching book groups with same baseId
      for (const g of grouped.values()) {
        if (g.kind !== "book") continue;
        if (g.baseId !== parentBase) continue;

        const title = String(gift?.title ?? "");
        const k = title; // group gifts by title under the same book
        const existing = g.gifts.get(k) ?? {
          title,
          image: String(gift?.image ?? ""),
          qty: 0,
        };
        existing.qty += Number(gift?.quantity ?? 0);
        g.gifts.set(k, existing);
      }
    }

    // ---- Sort: books first (by numeric baseId), then accessories ----
    const groups = Array.from(grouped.values()).sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "book" ? -1 : 1;
      const an = parseInt(a.baseId, 10);
      const bn = parseInt(b.baseId, 10);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.title.localeCompare(b.title);
    });

    // ---- Totals ----
    const subtotal = Number(data.subtotal ?? 0);
    const deliveryCost = Number(data.deliveryCost ?? 0);
    const total = Number(data.total ?? subtotal + deliveryCost);

    // ---- TEXT fallback (admin + customer) ----
    const itemsText = groups
      .map((g) => {
        const lineTotal = g.unitPrice * g.qty;
        const main = `• ${g.title} × ${g.qty} = $${money(lineTotal)}`;
        const giftLines = Array.from(g.gifts.values()).map(
          (x) => `   - ${x.title} × ${x.qty} = FREE`
        );
        return [main, ...giftLines].join("\n");
      })
      .join("\n");

    const adminText =
      `New Order\n\n` +
      `Name: ${data.firstName ?? ""} ${data.lastName ?? ""}\n` +
      `Phone: ${data.phone ?? "-"}\n` +
      `Email: ${customerEmail}\n\n` +
      `Delivery: ${data.deliveryMethod ?? "-"}\n` +
      `Region: ${data.governorate || "Pickup"}\n` +
      `City: ${data.city || "-"}\n` +
      `Address: ${data.address || "-"}\n\n` +
      `Order:\n${itemsText}\n\n` +
      `Subtotal: $${money(subtotal)}\n` +
      `Delivery: $${money(deliveryCost)}\n` +
      `Total: $${money(total)}\n`;

    const customerText =
      `Hi ${data.firstName ?? "there"},\n\n` +
      `Thanks — we received your order ✅\n\n` +
      `Order:\n${itemsText}\n\n` +
      `Subtotal: $${money(subtotal)}\n` +
      `Delivery: $${money(deliveryCost)}\n` +
      `Total: $${money(total)}\n\n` +
      `We’ll contact you shortly to confirm delivery details.\n\n` +
      `— Charbel Abdallah\n`;

    // ---- HTML builder for line items with images + freebies ----
    const itemRowsHtml = groups
      .map((g) => {
        const img = absImageUrl(siteUrl, g.image);
        const lineTotal = g.unitPrice * g.qty;

        const mainRow = `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;width:64px;">
              ${
                img
                  ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(
                      g.title
                    )}" width="52" height="52" style="display:block;border:1px solid #eee;border-radius:10px;object-fit:contain;background:#fff;" />`
                  : ``
              }
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;">
              <div style="font-size:14px;font-weight:600;color:#111;">${escapeHtml(g.title)}</div>
              <div style="font-size:12px;color:#666;margin-top:4px;">Qty: ${escapeHtml(
                g.qty
              )}</div>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:top;text-align:right;white-space:nowrap;font-size:14px;font-weight:600;color:#111;">
              $${escapeHtml(money(lineTotal))}
            </td>
          </tr>
        `.trim();

        const giftRows = Array.from(g.gifts.values())
          .map((x) => {
            const gimg = absImageUrl(siteUrl, x.image);
            return `
              <tr>
                <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f2f2f2;vertical-align:top;width:64px;">
                  ${
                    gimg
                      ? `<img src="${escapeHtml(gimg)}" alt="${escapeHtml(
                          x.title
                        )}" width="44" height="44" style="display:block;border:1px solid #f0f0f0;border-radius:10px;object-fit:contain;background:#fff;opacity:0.95;" />`
                      : ``
                  }
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f2f2f2;vertical-align:top;">
                  <div style="font-size:13px;font-weight:600;color:#111;">
                    ${escapeHtml(x.title)}
                    <span style="margin-left:8px;font-size:11px;font-weight:700;color:#b68b00;letter-spacing:.3px;">FREE GIFT</span>
                  </div>
                  <div style="font-size:12px;color:#666;margin-top:4px;">Qty: ${escapeHtml(
                    x.qty
                  )}</div>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f2f2f2;vertical-align:top;text-align:right;white-space:nowrap;font-size:13px;font-weight:700;color:#111;">
                  FREE
                </td>
              </tr>
            `.trim();
          })
          .join("");

        return mainRow + giftRows;
      })
      .join("");

    const totalsHtml = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;border-top:1px solid #eee;padding-top:12px;">
        <tr>
          <td style="font-size:13px;color:#444;padding:6px 0;">Subtotal</td>
          <td style="font-size:13px;color:#111;padding:6px 0;text-align:right;white-space:nowrap;">$${escapeHtml(
            money(subtotal)
          )}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#444;padding:6px 0;">Delivery</td>
          <td style="font-size:13px;color:#111;padding:6px 0;text-align:right;white-space:nowrap;">$${escapeHtml(
            money(deliveryCost)
          )}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#111;padding:10px 0;font-weight:800;border-top:1px solid #eee;">Total</td>
          <td style="font-size:14px;color:#111;padding:10px 0;text-align:right;white-space:nowrap;font-weight:800;border-top:1px solid #eee;">$${escapeHtml(
            money(total)
          )}</td>
        </tr>
      </table>
    `.trim();

    const customerHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#ffffff;color:#111;padding:24px;">
        <div style="max-width:620px;margin:0 auto;border:1px solid #eee;border-radius:14px;padding:18px 18px 10px;">
          <div style="font-size:18px;font-weight:800;margin-bottom:6px;">Order received ✅</div>
          <div style="font-size:13px;color:#555;margin-bottom:14px;">
            Hi ${escapeHtml(data.firstName ?? "there")}, thanks — we received your order. Below is your summary.
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${itemRowsHtml}
          </table>

          ${totalsHtml}

          <div style="margin-top:14px;font-size:13px;color:#555;">
            We’ll contact you shortly to confirm delivery details.
          </div>
          <div style="margin-top:10px;font-size:13px;color:#111;font-weight:700;">— Charbel Abdallah</div>

          <div style="margin-top:14px;font-size:11px;color:#777;">
            If you don’t see images, your email app may be blocking them — tap “Display images”.
          </div>
        </div>
      </div>
    `.trim();

    const adminHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#ffffff;color:#111;padding:24px;">
        <div style="max-width:720px;margin:0 auto;border:1px solid #eee;border-radius:14px;padding:18px;">
          <div style="font-size:18px;font-weight:800;margin-bottom:8px;">New Order</div>

          <div style="font-size:13px;color:#333;line-height:1.5;margin-bottom:12px;">
            <div><b>Name:</b> ${escapeHtml(data.firstName ?? "")} ${escapeHtml(data.lastName ?? "")}</div>
            <div><b>Phone:</b> ${escapeHtml(data.phone ?? "-")}</div>
            <div><b>Email:</b> ${escapeHtml(customerEmail)}</div>
            <div style="margin-top:8px;"><b>Delivery:</b> ${escapeHtml(data.deliveryMethod ?? "-")}</div>
            <div><b>Region:</b> ${escapeHtml(data.governorate || "Pickup")}</div>
            <div><b>City:</b> ${escapeHtml(data.city || "-")}</div>
            <div><b>Address:</b> ${escapeHtml(data.address || "-")}</div>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${itemRowsHtml}
          </table>

          ${totalsHtml}
        </div>
      </div>
    `.trim();

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
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Failed to send order" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

import { Resend } from "resend";

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const data = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    // --- Basic email sanity check (don’t send confirmation to junk) ---
    const customerEmail =
      typeof data.email === "string" && data.email.includes("@")
        ? data.email.trim()
        : null;

    const itemsText = Array.isArray(data.items)
      ? data.items
          .map(
            (i: any) =>
              `• ${i.title} × ${i.quantity} = ${
                i.isGift ? "FREE" : `$${Number(i.price || 0) * Number(i.quantity || 0)}`
              }`
          )
          .join("\n")
      : "(no items)";

    const subtotal = Number(data.subtotal ?? 0);
    const deliveryCost = Number(data.deliveryCost ?? 0);
    const total = Number(data.total ?? subtotal + deliveryCost);

    // --- Admin email body (your current format) ---
    const adminText = `
New Order

Name: ${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() + `
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
      // optional: makes replying to the admin email reply to the customer
      replyTo: customerEmail ?? undefined,
    });

    // If Resend returns an error object, treat it as failure
    if ((adminSend as any)?.error) {
      const msg = (adminSend as any).error?.message ?? "Admin email failed";
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Send customer confirmation (only if customerEmail is valid)
    let customerSend: any = null;

    if (customerEmail) {
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
        text: customerText,
      });

      if ((customerSend as any)?.error) {
        const msg =
          (customerSend as any).error?.message ?? "Customer email failed";
        return new Response(JSON.stringify({ success: false, error: msg }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Success response includes ids (useful for debugging)
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
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

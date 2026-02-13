import { Resend } from "resend";

export const onRequestPost = async (context: any) => {

  try {
    const { request, env } = context;
    const data = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    const itemsText = data.items
      .map(
        (i: any) =>
          `• ${i.title} × ${i.quantity} = ${
            i.isGift ? "FREE" : `$${i.price * i.quantity}`
          }`
      )
      .join("\n");

    await resend.emails.send({
      from: "onboarding@resend.dev",
 // must match domain verified in Resend
      to: "luxshopp.lb@gmail.com",
      subject: "New Order",
      text: `
New Order

Name: ${data.firstName} ${data.lastName}
Phone: ${data.phone}
Email: ${data.email || "-"}

Delivery: ${data.deliveryMethod}
Region: ${data.governorate || "Pickup"}
City: ${data.city || "-"}
Address: ${data.address || "-"}

Order:
${itemsText}

Subtotal: $${data.subtotal}
Delivery: $${data.deliveryCost}
Total: $${data.total}
`,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to send order" }), {
      status: 500,
    });
  }
};

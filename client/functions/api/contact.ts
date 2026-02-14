import { Resend } from "resend";

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const data = await request.json();

    const resend = new Resend(env.RESEND_API_KEY);

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const message = String(data.message || "").trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "All fields are required." }),
        { status: 400 }
      );
    }

    if (!email.includes("@") || !email.toLowerCase().endsWith(".com")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid .com email required." }),
        { status: 400 }
      );
    }

    // -------------------------
    // 1️⃣ Send to Charbel
    // -------------------------
    const admin = await resend.emails.send({
      from: "Website Contact <orders@charbelabdallah.com>",
      to: ["charbel_g_abdallah@hotmail.com"],
      subject: `New Contact Message from ${name}`,
      replyTo: email,
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-line;">${message}</p>
        </div>
      `,
    });

    if ((admin as any)?.error) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin email failed." }),
        { status: 500 }
      );
    }

    // -------------------------
    // 2️⃣ Confirmation to User
    // -------------------------
    const confirmation = await resend.emails.send({
      from: "Charbel Abdallah <orders@charbelabdallah.com>",
      to: [email],
      subject: "We received your message",
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h2>Hi ${name},</h2>
          <p>Thank you for reaching out.</p>
          <p>We received your message and will respond within 2–3 business days.</p>
          <hr />
          <p><strong>Your message:</strong></p>
          <p style="white-space:pre-line;">${message}</p>
          <br/>
          <p>— Charbel Abdallah</p>
        </div>
      `,
    });

    if ((confirmation as any)?.error) {
      return new Response(
        JSON.stringify({ success: false, error: "Confirmation email failed." }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed" }),
      { status: 500 }
    );
  }
};

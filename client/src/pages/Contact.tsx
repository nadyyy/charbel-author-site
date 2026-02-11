import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, Instagram } from "lucide-react";
import { toast } from "sonner";

/**
 * Design: Minimalist Luxury
 * - Clean contact form with elegant styling
 * - Multiple contact methods (email, form)
 * - Gold accents for form focus states
 * - Ample whitespace and clear hierarchy
 */

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate form submission (in a real app, this would send to a backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create mailto link with contact details
     const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=charbel_g_abdallah@hotmail.com&su=${encodeURIComponent(
  `Website Contact: Message from ${formData.name}`
)}&body=${encodeURIComponent(
  `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
)}`;

window.open(gmailLink, "_blank");


    

      toast.success("Message prepared! Your email client will open.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Title */}
      <section className="pt-8 pb-8 md:pt-10 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="serif-title text-4xl md:text-5xl text-black mb-4">Get in Touch</h1>
          <div className="gold-divider mx-auto"></div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="serif-title text-3xl md:text-4xl text-black mb-8">
                Contact Information
              </h2>

              <div className="space-y-8">
                {/* Email */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#d4af37] mt-1" />
                  </div>
                  <div>
                    <h3 className="serif-title text-lg text-black mb-2">Email</h3>
                    <a
                      href="mailto:charbelabdallah@gmail.com"
                      className="sans-body text-gray-600 hover:text-[#d4af37] transition-colors"
                    >
                      charbel_g_abdallah@hotmail.com
                    </a>
                    <p className="sans-body text-sm text-gray-500 mt-2">
                      For book orders, inquiries, and general correspondence
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Phone className="w-6 h-6 text-[#d4af37] mt-1" />
                  </div>
                  <div>
                    <h3 className="serif-title text-lg text-black mb-2">Phone</h3>
                    <p className="sans-body text-gray-600">+961 76 640164</p>
                    <p className="sans-body text-sm text-gray-500 mt-2">
                      Available for interviews and speaking engagements
                    </p>
                  </div>
                </div>
                {/* Instagram */}
<div className="flex gap-4">
  <div className="flex-shrink-0">
    <Instagram className="w-6 h-6 text-[#d4af37] mt-1" />
  </div>
  <div>
    <h3 className="serif-title text-lg text-black mb-2">Instagram</h3>
    <a
      href="https://instagram.com/bycharbelabdallah"
      target="_blank"
      rel="noopener noreferrer"
      className="sans-body text-gray-600 hover:text-[#d4af37] transition-colors"
    >
      @bycharbelabdallah
    </a>
    <p className="sans-body text-sm text-gray-500 mt-2">
      Poetry, releases, and excerpts
    </p>
  </div>
</div>


                {/* Location */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#d4af37] mt-1" />
                  </div>
                  <div>
                    <h3 className="serif-title text-lg text-black mb-2">Location</h3>
                    <p className="sans-body text-gray-600">
                      Based in Batroun, Lebanon
                    </p>
                  </div>
                </div>
              </div>

              <div className="gold-divider my-8"></div>

              {/* Response Time */}
              <div className="bg-gray-50 p-6 rounded-sm border border-gray-200">
                <p className="sans-body text-sm text-gray-700">
                  <span className="font-semibold text-black">Response Time:</span> We typically respond to inquiries within 2-3 business days.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="serif-title text-3xl md:text-4xl text-black mb-8">
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block sans-body text-sm font-medium text-black mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block sans-body text-sm font-medium text-black mb-2"
                  >
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block sans-body text-sm font-medium text-black mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Share your message, question, or inquiry..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white hover:bg-[#d4af37] hover:text-black transition-colors font-medium py-3"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>

                <p className="sans-body text-xs text-gray-500 text-center">
                  We respect your privacy. Your information will not be shared.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <h2 className="serif-title text-4xl md:text-5xl text-black text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            {[
              {
                question: "How can I order the books?",
                answer:
                  "You can order directly by clicking the 'Buy Now' button on the Books page, or by emailing charbel_g_abdallah@hotmail.com with your order details.",
              },
              {
                question: "When will Encore be released?",
                answer:
                  "Encore is coming soon! Sign up for updates or reach out to charbel_g_abdallah@hotmail.com to be notified when it becomes available.",
              },
              {
                question: "Are there signed copies available?",
                answer:
                  "Yes, signed copies are available upon request. Please email charbel_g_abdallah@hotmail.com with your inquiry.",
              },
              {
                question: "Do you offer bulk orders or wholesale pricing?",
                answer:
                  "We do! For bulk orders or wholesale inquiries, please contact charbel_g_abdallah@hotmail.com with your details.",
              },
            ].map((faq, index) => (
              <div key={index} className="border-l-2 border-[#d4af37] pl-6">
                <h3 className="serif-title text-lg text-black mb-3">
                  {faq.question}
                </h3>
                <p className="sans-body text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

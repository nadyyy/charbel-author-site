import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

/**
 * Design: Minimalist Luxury
 * - Grid layout with staggered book cards
 * - Each book has cover image, description, price, and CTA
 * - Gold accents for pricing and buttons
 * - Subtle shadows and hover effects
 */

interface Book {
  id: number;
  title: string;
  price: string;
  description: string;
  quote: string;
  image: string;
  available: boolean;
}

const books: Book[] = [
  {
    id: 1,
    title: "Carrefour",
    price: "$15",
    description:
      "Raw and honest, Carrefour navigates darkness, survival, and storytelling. A visual and emotional journey anchored by the semicolon symbol.",
    quote: "This is my story—always was, always will be.",
    image: "/books/carrefour.png",
    available: true,
  },
  {
    id: 2,
    title: "Soldier Poet King",
    price: "$20",
    description:
      "A poetic exploration of identity, impermanence, and power. Evocative and bold, this collection confronts what fades and what endures.",
    quote: "Tell me why all people fade and only I remain…",
    image: "/books/soldier-poet-king.png",
    available: true,
  },
  {
    id: 3,
    title: "Encore",
    price: "Coming Soon",
    description:
      "The upcoming third collection from Charbel Abdallah. Encore is a continuation of poetic intensity, touching memory, longing, and artistic legacy.",
    quote: "Stay tuned for what's next.",
    image: "/books/encore.png",
    available: false,
  },
];

export default function Books() {
  const { addItem } = useCart();

  return (
    <div className="min-h-screen bg-white">
      {/* Page Title */}
      <section className="pt-8 pb-8 md:pt-10 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="serif-title text-4xl md:text-5xl text-black mb-4">
            Published Works
          </h1>
          <div className="gold-divider mx-auto"></div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {books.map((book, index) => (
              <div
                key={book.id}
                className={`book-card p-0 overflow-hidden flex flex-col ${
                  index === 1 ? "md:mt-8" : ""
                }`}
              >
                {/* Book Cover */}
                <div className="p-6 flex justify-center">
                  <div className="inline-block bg-white shadow-md shadow-black/25">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="block max-h-96 w-auto"
                    />
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <h3 className="serif-title text-2xl md:text-3xl text-black mb-2">
                    {book.title}
                  </h3>

                  <p className="text-[#d4af37] font-semibold text-lg mb-4">
                    {book.price}
                  </p>

                  <p className="sans-body text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                    {book.description}
                  </p>

                  <blockquote className="serif-title text-sm italic text-gray-700 mb-6 border-l-2 border-[#d4af37] pl-4">
                    "{book.quote}"
                  </blockquote>

                  {/* CTA Button */}
                  {book.available ? (
                    <Button
                      className="w-full bg-black text-white hover:bg-[#d4af37] hover:text-black transition-colors font-medium"
                      onClick={() =>
                        addItem({
                          id: book.id,
                          title: book.title,
                          price: parseInt(book.price.replace("$", "")),
                          image: book.image,
                        })
                      }
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 cursor-not-allowed font-medium"
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="serif-title text-4xl md:text-5xl text-black text-center mb-12">
            What Readers Say
          </h2>

          <div className="space-y-12">
            {[
              {
                quote:
                  "Charbel's words cut deeper than most novels. Every line in Soldier Poet King feels like a revelation.",
                author: "Elena M.",
                role: "Literary Reviewer",
              },
              {
                quote:
                  "Carrefour helped me feel seen. It's brave, unfiltered, and unforgettable.",
                author: "George K.",
                role: "Poet & Reader",
              },
              {
                quote:
                  "I'm counting the days until Encore drops. Charbel Abdallah's work is a balm for the fractured soul.",
                author: "Maya Y.",
                role: "Reader",
              },
            ].map((testimonial, index) => (
              <div key={index} className="text-center">
                <div className="gold-divider mb-6"></div>
                <blockquote className="serif-title text-2xl md:text-3xl text-black italic mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <p className="sans-body text-gray-700 font-medium">
                  — {testimonial.author}
                </p>
                <p className="sans-body text-gray-500 text-sm">
                  {testimonial.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

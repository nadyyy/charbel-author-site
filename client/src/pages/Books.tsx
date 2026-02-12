import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

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
 const { addBookWithGift } = useCart();


  // ✅ Freebie picker state
  const [freebieOpen, setFreebieOpen] = useState(false);
  const [pendingBook, setPendingBook] = useState<Book | null>(null);
  const [selectedFreebieId, setSelectedFreebieId] = useState<string>("");


  // ✅ Match your Accessories titles exactly
const FREEBIES: Record<number, { id: string; title: string; image: string }[]> = {
  1: [
    { id: "armageddon-insert", title: "Armageddon Insert", image: "/accessories/armageddon-insert.jpeg" },
    { id: "judas-insert", title: "Judas Insert", image: "/accessories/judas-insert.jpeg" },
    { id: "oblivion-insert", title: "Oblivion Insert", image: "/accessories/oblivion-insert.jpeg" },
  ],
  2: [
    { id: "king-bookmark", title: "King Bookmark", image: "/accessories/king-bookmark.jpeg" },
    { id: "lord-bookmark", title: "Lord Bookmark", image: "/accessories/lord-bookmark.jpeg" },
    { id: "poet-bookmark", title: "Poet Bookmark", image: "/accessories/poet-bookmark.jpeg" },
    { id: "soldier-bookmark", title: "Soldier Bookmark", image: "/accessories/soldier-bookmark.jpeg" },
  ],
};



  const openFreebiePicker = (book: Book) => {
  const options = FREEBIES[book.id];

  // no freebies -> do nothing special (book has freebies in your current setup, so this is just safe)
  if (!options || options.length === 0) {
    // If you want “no freebies” books to still add normally, you can add a normal addItem flow here.
    return;
  }

  setPendingBook(book);
  setSelectedFreebieId(options[0].id); // default option
  setFreebieOpen(true);
};

  const confirmFreebie = () => {
  if (!pendingBook) return;

  const gift = FREEBIES[pendingBook.id].find((g) => g.id === selectedFreebieId);
  if (!gift) return;

  addBookWithGift(
    {
      id: String(pendingBook.id),
      title: pendingBook.title,
      price: parseInt(pendingBook.price.replace("$", ""), 10),
      image: pendingBook.image,
      kind: "book",
    },
    {
      id: gift.id,
      title: gift.title,
      image: gift.image,
    }
  );

  setFreebieOpen(false);
  setPendingBook(null);
};
const selectedGift =
  pendingBook ? FREEBIES[pendingBook.id].find((g) => g.id === selectedFreebieId) : null;


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
                      onClick={() => openFreebiePicker(book)}
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

      {/* ✅ Freebie Modal */}
      {freebieOpen && pendingBook && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          {/* backdrop */}
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setFreebieOpen(false)}
            aria-label="Close"
          />

          {/* modal */}
          <div className="relative w-full max-w-3xl bg-white border border-gray-100 shadow-xl p-5 md:p-8 max-h-[85vh] overflow-y-auto">


            <h3 className="serif-title text-2xl text-black mb-2">
              Choose your free gift
            </h3>
            <p className="sans-body text-gray-600 text-sm mb-6">
              Included with{" "}
              <span className="font-medium text-black">{pendingBook.title}</span>
              .
            </p>

           <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
  {/* options */}
  <div className="space-y-3 order-1">
    {FREEBIES[pendingBook.id].map((opt) => {
      const active = selectedFreebieId === opt.id;

      return (
        <label
          key={opt.id}
          className={`flex items-center gap-4 cursor-pointer rounded-md border p-3 transition ${
            active ? "border-black bg-gray-50" : "border-gray-100 hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            checked={active}
            onChange={() => setSelectedFreebieId(opt.id)}
          />

           <div className="h-16 w-16 shrink-0 rounded bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
  <img
    src={opt.image}
    alt={opt.title}
    className={`h-full w-full object-contain ${
      opt.id === "judas-insert" || opt.id === "oblivion-insert"
        ? "scale-[1.35]"
        : ""
    }`}
  />
</div>


          <span className="sans-body text-sm text-black">{opt.title}</span>
        </label>
      );
    })}
  </div>

  {/* preview */}
  <div className="order-2 md:order-none rounded-md border border-gray-100 bg-gray-50 p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
      Preview
    </p>

    <div className="w-full aspect-[4/3] md:aspect-[3/4] rounded bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden p-3">
      {selectedGift ? (
        <img
          src={selectedGift.image}
          alt={selectedGift.title}
          className="h-full w-full object-contain"
        />
      ) : null}
    </div>

    <p className="mt-3 text-sm font-medium text-black">
      {selectedGift?.title ?? ""}
    </p>
  </div>
</div>



           <div className="mt-6 flex gap-3 justify-end sticky bottom-0 bg-white pt-4 border-t border-gray-100">

              <Button
                variant="outline"
                onClick={() => setFreebieOpen(false)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Cancel
              </Button>

              <Button
                onClick={confirmFreebie}
                className="bg-black text-white hover:bg-[#d4af37] hover:text-black"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      )}

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

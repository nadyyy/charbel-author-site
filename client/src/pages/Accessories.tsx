import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

type ItemKind = "bracelet" | "bookmark" | "insert";

type AccessoryItem = {
  id: string; // ✅ match your CartContext (string id)
  title: string;
  price: number;
  image: string;
  kind: ItemKind;
  note?: string; // e.g. "Free with Carrefour" OR bracelet tagline
  comingSoon?: boolean;
};

export default function Accessories() {
  const { addItem } = useCart();

  const [pressedId, setPressedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<AccessoryItem | null>(null);

  const items = useMemo<AccessoryItem[]>(
    () => [
      // Bracelets ($10)
      {
        id: "bracelet-crown",
        title: "Crown Bracelet",
        price: 10,
        image: "/accessories/crown.jpeg",
        kind: "bracelet",
        note: "charm — subtle, bold, and clean.",
      },
      {
        id: "bracelet-helmet",
        title: "Helmet Bracelet",
        price: 10,
        image: "/accessories/helmet.jpeg",
        kind: "bracelet",
        note: "charm — strength in a minimal form.",
      },

      // Bookmarks ($1)
      {
        id: "bookmark-king",
        title: "King Bookmark",
        price: 1,
        image: "/accessories/king-bookmark.jpeg",
        kind: "bookmark",
        note: "Free with Soldier Poet King",
      },
      {
        id: "bookmark-poet",
        title: "Poet Bookmark",
        price: 1,
        image: "/accessories/poet-bookmark.jpeg",
        kind: "bookmark",
        note: "Free with Soldier Poet King",
      },
      {
        id: "bookmark-soldier",
        title: "Soldier Bookmark",
        price: 1,
        image: "/accessories/soldier-bookmark.jpeg",
        kind: "bookmark",
        note: "Free with Soldier Poet King",
      },
      {
        id: "bookmark-lord",
        title: "Lord Bookmark",
        price: 1,
        image: "/accessories/lord-bookmark.jpeg", // ✅ MUST match filename exactly
        kind: "bookmark",
        note: "Free with Soldier Poet King",
      },

      // Inserts ($1)
      {
        id: "insert-armageddon",
        title: "Armageddon Insert",
        price: 1,
        image: "/accessories/armageddon-insert.jpeg",
        kind: "insert",
        note: "Free with Carrefour",
      },
      {
        id: "insert-oblivion",
        title: "Oblivion Insert",
        price: 1,
        image: "/accessories/oblivion-insert.jpeg",
        kind: "insert",
        note: "Free with Carrefour",
      },
      {
        id: "insert-judas",
        title: "Judas Insert",
        price: 1,
        image: "/accessories/judas-insert.jpeg",
        kind: "insert",
        note: "Free with Carrefour",
      },

      // Encore bookmark (coming soon)
      {
        id: "bookmark-encore",
        title: "Encore Bookmark",
        price: 1,
        image: "/accessories/encore-bookmark.jpeg",
        kind: "bookmark",
        note: "Free with Encore",
        comingSoon: true,
      },
    ],
    []
  );

  const handleAdd = (item: AccessoryItem) => {
    if (item.comingSoon) return;

    setPressedId(item.id);
    window.setTimeout(() => setPressedId(null), 140);

    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Title */}
      <section className="pt-8 pb-8 md:pt-10 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h1 className="serif-title text-4xl md:text-5xl text-black mb-4">
            Accessories
          </h1>

          {/* ✅ OLD divider */}
          <div className="gold-divider mx-auto"></div>

          {/* ✅ keep your improved sentence(s) if you want; this is just a placeholder */}
          {/* <p className="sans-body text-gray-600 mt-6 max-w-2xl mx-auto text-sm md:text-base">
            Curated add-ons designed to live beside the books.
          </p> */}
        </div>
      </section>

      {/* Grid */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
           {items.map((item) => {
  const cartId = String(item.id);

  // Your insert files have different white margins baked in.
  // Zoom the ones that look too small without cropping.
  const isJudasOrOblivion =
    item.image.toLowerCase().includes("judas") ||
    item.image.toLowerCase().includes("oblivion");

  const imgZoomClass = isJudasOrOblivion
    ? "scale-[1.55]"
    : item.kind === "insert"
    ? "scale-[1.25]"
    : item.kind === "bookmark"
    ? "scale-[1.08]"
    : "scale-100";

  return (
    <div key={cartId} className="book-card p-0 overflow-hidden flex flex-col">
      {/* IMAGE (fixed height so every card lines up) */}
      <div className="p-6 flex justify-center">
        <div className="w-full max-w-[360px] bg-white shadow-md shadow-black/25 flex items-center justify-center h-[260px] md:h-[300px] overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className={`block max-h-full max-w-full object-contain transition-transform duration-200 ${imgZoomClass}`}
          />
        </div>
      </div>

      {/* INFO (button stays bottom, spacing consistent) */}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4">
          <h3
            className="
              serif-title text-2xl md:text-[25.5px] leading-[1.05] text-black
              min-w-0
              md:whitespace-nowrap
              whitespace-normal
            "
          >
            {item.title}
          </h3>

          <p className="text-[#d4af37] font-semibold text-lg shrink-0">
            ${item.price}
          </p>
        </div>

        {/* note / subtitle */}
        <div className="mt-3 min-h-[26px]">
          {item.note ? (
            <p className="sans-body text-gray-600 text-sm flex items-center gap-3">
              <span className="inline-block w-[2px] h-4 bg-[#d4af37]" />
              {item.note}
            </p>
          ) : null}
        </div>

        {/* CTA (always bottom) */}
        <div className="mt-auto pt-5">
          <Button
            className={`w-full bg-black text-white hover:bg-[#d4af37] hover:text-black transition-colors font-medium ${
              pressedId === cartId ? "scale-[0.985]" : ""
            }`}
            disabled={item.comingSoon}
            onClick={() => handleAdd(item)}
          >
            {item.comingSoon ? "Coming Soon" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
})}

          </div>
        </div>
      </section>

      {/* Desktop Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 hidden md:flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="serif-title text-2xl text-black">
                  {preview.title}
                </div>
                <div className="text-[#d4af37] font-semibold">
                  ${preview.price}
                </div>
                {preview.note ? (
                  <div className="text-sm text-gray-600 mt-1">
                    {preview.note}
                  </div>
                ) : null}
              </div>

              <button
                className="h-10 w-10 rounded-full border border-gray-200 hover:bg-gray-50"
                onClick={() => setPreview(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center">
              <img
                src={preview.image}
                alt={preview.title}
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

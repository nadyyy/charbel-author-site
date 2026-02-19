import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { books } from "@/data/BookData";
import { Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Props = { id: string };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildPrettyUrlFromCurrent(title: string) {
  if (typeof window === "undefined") return `/books/${slugify(title)}`;
  const u = new URL(window.location.href);
  u.pathname = `/books/${slugify(title)}`;
  return u.toString();
}

export default function BookDetails({ id }: Props) {
  const { addBookWithGift } = useCart();

  const book = useMemo(() => {
    const byId = books.find((b) => String(b.id) === String(id));
    if (byId) return byId;

    const key = String(id).toLowerCase();
    return books.find((b) => slugify(b.title) === key) ?? null;
  }, [id]);

  const freebies = book?.freebies ?? [];

  const [freebieOpen, setFreebieOpen] = useState(false);
  const [selectedFreebieId, setSelectedFreebieId] = useState<string>("");

  const selectedGift = freebies.find((g) => g.id === selectedFreebieId) ?? null;

  useEffect(() => {
    if (!book) return;
    if (typeof window === "undefined") return;

    const desiredPath = `/books/${slugify(book.title)}`;
    if (window.location.pathname !== desiredPath) {
      window.history.replaceState(
        null,
        "",
        desiredPath + window.location.search + window.location.hash
      );
    }
  }, [book]);

  const openFreebiePicker = () => {
    if (!book || !book.available) return;
    if (freebies.length === 0) return;

    setSelectedFreebieId(freebies[0].id);
    setFreebieOpen(true);
  };

  const confirmFreebie = () => {
    if (!book) return;

    const gift = freebies.find((g) => g.id === selectedFreebieId);
    if (!gift) return;

    addBookWithGift(
      {
        id: String(book.id),
        title: book.title,
        price: parseInt(String(book.price).replace("$", ""), 10),
        image: book.image,
        kind: "book",
      },
      {
        id: gift.id,
        title: gift.title,
        image: gift.image,
      }
    );

    setFreebieOpen(false);
  };

  const onShare = async () => {
    if (!book) return;

    const url = buildPrettyUrlFromCurrent(book.title);

    const nav: Navigator | undefined =
      typeof window !== "undefined" ? window.navigator : undefined;

    const shareData: ShareData = {
      title: `${book.title} — Charbel Abdallah`,
      text: `${book.title} — Charbel Abdallah`,
      url,
    };

    try {
      if (nav && "share" in nav && typeof (nav as any).share === "function") {
        await (nav as any).share(shareData);
        return;
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      // fall through to copy
    }

    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        toast.success("Link copied");
        return;
      }
    } catch {
      // continue
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-10">
          <h1 className="serif-title text-4xl text-black mb-3">Not found</h1>
          <p className="sans-body text-gray-600 mb-6">That book doesn’t exist.</p>
          <Link
            href="/books"
            className="sans-body text-sm font-medium text-black hover:text-[#d4af37]"
          >
            ← Back to Published Works
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-5 pb-7 md:pt-10 md:pb-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/books"
                className="sans-body text-sm text-gray-700 hover:text-black transition-colors"
              >
                ← Back to Published Works
              </Link>

              <button
                type="button"
                onClick={onShare}
                className="sans-body text-sm font-medium text-black hover:text-[#d4af37] transition-colors inline-flex items-center gap-2"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            <h1 className="serif-title text-4xl text-black text-center mt-6 leading-tight break-words">
              {book.title}
            </h1>

            <div className="gold-divider mt-5 mx-auto"></div>
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <Link
                href="/books"
                className="sans-body text-sm text-gray-700 hover:text-black transition-colors whitespace-nowrap"
              >
                ← Back to Published Works
              </Link>

              <h1 className="serif-title text-4xl md:text-6xl text-black text-center leading-tight">
                {book.title}
              </h1>

              <button
                type="button"
                onClick={onShare}
                className="sans-body text-sm font-medium text-black hover:text-[#d4af37] transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            <div className="gold-divider mt-6"></div>
          </div>
        </div>
      </section>

      <section className="pb-14 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-7 md:gap-12 items-start">
            <div className="overflow-hidden border border-gray-100 bg-white">
              <div className="p-5 md:p-6 flex justify-center">
                <div className="inline-block bg-white shadow-md shadow-black/25">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="block max-h-96 w-auto"
                  />
                </div>
              </div>

              <div className="px-5 md:px-6 pb-5 md:pb-6">
                {book.available && freebies.length > 0 ? (
                  <p className="text-xs uppercase tracking-wide text-gray-500 text-center md:text-left">
                    Includes a free gift
                  </p>
                ) : (
                  <div className="h-[14px]" />
                )}
              </div>
            </div>

            <div className="pt-0 md:pt-2">
              <div className="mb-5 text-center md:text-left">
                {book.available ? (
                  <p className="text-[#d4af37] font-semibold text-xl">
                    {book.price}
                  </p>
                ) : (
                  <p className="text-gray-500 font-medium text-lg">Coming Soon</p>
                )}
              </div>

              <p className="sans-body text-gray-600 text-base leading-relaxed mb-5">
                {book.description}
              </p>

              {book.detailBlurb ? (
                <p className="sans-body text-gray-600 text-base leading-relaxed mb-6">
                  {book.detailBlurb}
                </p>
              ) : null}

              <blockquote className="serif-title text-base italic text-gray-700 mb-8 border-l-2 border-[#d4af37] pl-4">
                "{book.quote}"
              </blockquote>

              {book.available ? (
                <Button
                  className="w-full bg-black text-white hover:bg-[#d4af37] hover:text-black transition-colors font-medium"
                  onClick={openFreebiePicker}
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
        </div>
      </section>

      {freebieOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setFreebieOpen(false)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-3xl bg-white border border-gray-100 shadow-xl p-5 md:p-8 max-h-[85vh] overflow-y-auto">
            <h3 className="serif-title text-2xl text-black mb-2">
              Choose your free gift
            </h3>
            <p className="sans-body text-gray-600 text-sm mb-6">
              Included with{" "}
              <span className="font-medium text-black">{book.title}</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
              <div className="space-y-3 order-1">
                {freebies.map((opt) => {
                  const active = selectedFreebieId === opt.id;

                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-4 cursor-pointer rounded-md border p-3 transition ${
                        active
                          ? "border-black bg-gray-50"
                          : "border-gray-100 hover:bg-gray-50"
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
                            opt.id === "judas-insert" ||
                            opt.id === "oblivion-insert"
                              ? "scale-[1.35]"
                              : ""
                          }`}
                        />
                      </div>

                      <span className="sans-body text-sm text-black">
                        {opt.title}
                      </span>
                    </label>
                  );
                })}
              </div>

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
    </div>
  );
}

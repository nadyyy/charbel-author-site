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

type LongCopy = {
  tagline?: string;
  paragraphs: string[];
  stanza?: string[];
};

const LONG_COPY: Record<number, LongCopy> = {
  1: {
    tagline: "The origin. The raw confession.",
    paragraphs: [
      "Carrefour is Charbel’s most autobiographical and unfiltered work. It reads like an open diary — mental health struggles, fear, panic attacks, forbidden love, suicidal ideation, identity crisis, vulnerability, and survival in a world that feels hostile.",
      "It is the crossroads — exactly as the title suggests.",
      "Where Soldier, Poet, King is theatrical and symbolic, and Encore is reflective and poetic, Carrefour is direct, confessional, and emotionally naked. It is the foundation — the psychological and emotional terrain from which the other two books rise.",
    ],
    stanza: [
      "Between life and death.",
      "Between love and destruction.",
      "Between wanting to stay and wanting to disappear.",
    ],
  },
  2: {
    tagline: "A poetic trilogy of identity, love, ego, and self-destruction.",
    paragraphs: [
      "Soldier, Poet, King follows a man divided into three archetypes: the fighter shaped by trauma, the lover ruled by emotion, and the ruler chasing pride and power. Through intense, raw, and often brutal poetry, the book explores toxic love, betrayal, masculinity, vulnerability, wounded ego, and the cost of refusing to let go.",
      "It is a story of wars fought in bedrooms instead of battlefields, crowns made of thorns instead of gold, and a man constantly oscillating between strength and fragility. At its core, it asks:",
      "What am I, if not a soldier, a king, and the poet in between?",
      "Dark, dramatic, theatrical — this is love as war and identity as a battlefield.",
    ],
    stanza: ["The Soldier bleeds.", "The Poet feels.", "The King falls."],
  },
  3: {
    tagline: "The aftermath. The silence after the applause.",
    paragraphs: [
      "If Soldier, Poet, King was the performance, Encore is what happens when the lights dim. This book is quieter, heavier, more intimate. It deals with grief, growing older, death, memory, anxiety, destiny, and the ghosts that remain when love is gone.",
      "It is not about crowns or battles. It is about ash. Breath. Survival.",
      "From existential fear of turning twenty, to conversations with Death, to mourning someone who still breathes in memory, Encore feels like standing alone on a stage after everyone has left — asking whether you were ever meant to perform in the first place.",
      "It is darker in a different way: less dramatic, more internal. Less war, more wound. Less ego, more soul.",
    ],
  },
};

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

  const [longOpen, setLongOpen] = useState(false);

  useEffect(() => {
    setLongOpen(false);
  }, [book?.id]);

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

  const longCopy = LONG_COPY[book.id];

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
          <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-7 md:gap-12 items-start">
            {/* LEFT: Cover + price + CTA */}
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
                <div className="text-center">
                  {book.available ? (
                    <p className="text-[#d4af37] font-semibold text-xl">
                      {book.price}
                    </p>
                  ) : (
                    <p className="text-gray-500 font-medium text-lg">Coming Soon</p>
                  )}
                </div>

                <div className="mt-4">
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

                <div className="mt-4">
                  {book.available && freebies.length > 0 ? (
                    <p className="text-xs uppercase tracking-wide text-gray-500 text-center">
                      Includes a free gift
                    </p>
                  ) : (
                    <div className="h-[14px]" />
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Description section (long copy only) */}
            <div className="border border-gray-100 bg-white p-5 md:p-6">
              <h2 className="serif-title text-2xl md:text-3xl text-black text-center md:text-left">
                Description
              </h2>
              <div className="gold-divider mt-4 mb-6 md:mx-0 mx-auto"></div>

              {longCopy?.tagline ? (
                <p className="serif-title text-base italic text-gray-800 mb-5 text-center md:text-left">
                  {longCopy.tagline}
                </p>
              ) : null}

              {longCopy ? (
                <div className="relative">
                  <div
                    className={[
                      "space-y-4",
                      longOpen ? "" : "max-h-64 overflow-hidden",
                    ].join(" ")}
                  >
                    {longCopy.paragraphs.map((p, idx) => (
                      <p
                        key={idx}
                        className="sans-body text-base leading-relaxed text-gray-700"
                      >
                        {p}
                      </p>
                    ))}

                    {longCopy.stanza && longCopy.stanza.length > 0 ? (
                      <div className="mt-2 border-l-2 border-[#d4af37] pl-4 space-y-1">
                        {longCopy.stanza.map((line, idx) => (
                          <p
                            key={idx}
                            className="serif-title text-base italic text-gray-700"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {!longOpen ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white" />
                  ) : null}
                </div>
              ) : null}

              {longCopy ? (
                <button
                  type="button"
                  onClick={() => setLongOpen((v) => !v)}
                  className="mt-4 sans-body text-sm font-medium text-black hover:text-[#d4af37] transition-colors"
                >
                  {longOpen ? "Read less" : "Read more"}
                </button>
              ) : null}
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
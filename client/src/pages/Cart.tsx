import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLocation } from "wouter";

const GOVERNORATES = [
  "Beirut",
  "Mount Lebanon",
  "North Lebanon",
  "Akkar",
  "Bekaa",
  "Baalbek-Hermel",
  "South Lebanon",
  "Nabatieh",
];

export default function Cart() {
  const {
    state,
    addBookWithGift,
    updateQuantity,
    setDeliveryMethod,
    setGovernorate,
    subtotal,
    deliveryCost,
    total,
    clearCart,
  } = useCart();

  const isGift = (item: any) => item?.isGift === true;

  const giftFor = (item: any) => {
    const parentId = item?.parentId;
    if (!parentId) return "";
    const parent = state.items.find((x: any) => x.id === parentId);
    return parent?.title ?? "";
  };

  // ✅ Same freebie catalog as Books (images are in /accessories/*.jpeg)
  const FREEBIES: Record<number, { id: string; title: string; image: string }[]> = {
    1: [
      {
        id: "armageddon-insert",
        title: "Armageddon Insert",
        image: "/accessories/armageddon-insert.jpeg",
      },
      { id: "judas-insert", title: "Judas Insert", image: "/accessories/judas-insert.jpeg" },
      {
        id: "oblivion-insert",
        title: "Oblivion Insert",
        image: "/accessories/oblivion-insert.jpeg",
      },
    ],
    2: [
      { id: "king-bookmark", title: "King Bookmark", image: "/accessories/king-bookmark.jpeg" },
      { id: "lord-bookmark", title: "Lord Bookmark", image: "/accessories/lord-bookmark.jpeg" },
      { id: "poet-bookmark", title: "Poet Bookmark", image: "/accessories/poet-bookmark.jpeg" },
      {
        id: "soldier-bookmark",
        title: "Soldier Bookmark",
        image: "/accessories/soldier-bookmark.jpeg",
      },
    ],
  };

  const [freebieOpen, setFreebieOpen] = useState(false);
  const [pendingBookItem, setPendingBookItem] = useState<any>(null);
  const [selectedFreebieId, setSelectedFreebieId] = useState("");
  const [clearOpen, setClearOpen] = useState(false);

  const confirmClearCart = () => {
    clearCart();
    setClearOpen(false);
  };

  const baseBookIdOf = (item: any) => {
    const raw = String(item?.id ?? "");
    const base = raw.split("::")[0];
    const n = parseInt(base, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const openFreebiePickerFromCart = (bookItem: any) => {
    const baseId = baseBookIdOf(bookItem);
    const options = FREEBIES[baseId];
    if (!options || options.length === 0) return;

    setPendingBookItem(bookItem);
    setSelectedFreebieId(options[0].id);
    setFreebieOpen(true);
  };

  const selectedGift =
    pendingBookItem
      ? FREEBIES[baseBookIdOf(pendingBookItem)]?.find((g) => g.id === selectedFreebieId) ?? null
      : null;

  const confirmFreebieFromCart = () => {
    if (!pendingBookItem) return;
    const baseId = baseBookIdOf(pendingBookItem);
    const gift = FREEBIES[baseId]?.find((g) => g.id === selectedFreebieId);
    if (!gift) return;

    addBookWithGift(
      {
        id: String(baseId),
        title: pendingBookItem.title,
        price: pendingBookItem.price,
        image: pendingBookItem.image,
        kind: "book",
      },
      { id: gift.id, title: gift.title, image: gift.image }
    );

    setFreebieOpen(false);
    setPendingBookItem(null);
  };

  // ✅ FORM STATE
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);

  // ✅ VALIDATION
  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    (state.deliveryMethod === "pickup" ||
      (state.governorate && city.trim() && address.trim()));

  // ✅ WHATSAPP
  const handlePlaceOrder = async () => {
  if (!isValid) return;

  const confirm = window.confirm(
    "Are you sure you want to place this order?"
  );
  if (!confirm) return;

  const res = await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName,
      lastName,
      phone,
      email,
      deliveryMethod: state.deliveryMethod,
      governorate: state.governorate,
      city,
      address,
      items: state.items,
      subtotal,
      deliveryCost,
      total,
    }),
  });

  if (res.ok) {
    alert("Order placed successfully!");
    clearCart();
  } else {
    alert("Something went wrong. Please try again.");
  }
};


  const [, setLocation] = useLocation();

  // ✅ GROUPING (book base id -> aggregate qty + gifts)
  const baseIdOf = (rawId: any) => String(rawId ?? "").split("::")[0];
  const isBookLine = (i: any) => {
  if (i?.isGift) return false;
  if ((i?.kind ?? "book") !== "book") return false;

  const base = baseIdOf(i.id);
  return /^\d+$/.test(base); // ✅ only numeric ids are real books
};

  const isGiftLine = (i: any) => i?.isGift === true;

  const groupedBooks = (() => {
    const map = new Map<
      string,
      {
        baseId: string;
        title: string;
        unitPrice: number;
        image: string;
        qty: number;
        gifts: Map<string, { title: string; image: string; qty: number }>;
      }
    >();

    // books
    state.items.forEach((i: any) => {
      if (!isBookLine(i)) return;

      const baseId = baseIdOf(i.id);
      const g =
        map.get(baseId) ?? {
          baseId,
          title: i.title,
          unitPrice: i.price,
          image: i.image,
          qty: 0,
          gifts: new Map(),
        };

      g.qty += i.quantity;
      map.set(baseId, g);
    });

    // gifts
    state.items.forEach((i: any) => {
      if (!isGiftLine(i)) return;
      if (!i.parentId) return;

      const baseId = baseIdOf(i.parentId);
      const g = map.get(baseId);
      if (!g) return;

      const key = i.title;
      const existing = g.gifts.get(key) ?? { title: i.title, image: i.image, qty: 0 };
      existing.qty += i.quantity;
      g.gifts.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => {
      const an = parseInt(a.baseId, 10);
      const bn = parseInt(b.baseId, 10);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.baseId.localeCompare(b.baseId);
    });
  })();
  const accessoryLines = state.items.filter((i: any) => {
  if (i?.isGift) return false;

  const base = baseIdOf(i.id);

  // ✅ if kind is accessory OR id is non-numeric -> treat as accessory
  return (i?.kind === "accessory") || !/^\d+$/.test(base);
});


  const removeOneFromGroup = (baseId: string) => {
    const candidate = [...state.items]
      .reverse()
      .find((i: any) => isBookLine(i) && baseIdOf(i.id) === baseId);

    if (!candidate) return;

    // bundled book lines are qty=1 -> remove bundle
    if (String(candidate.id).includes("::book::")) {
      updateQuantity(candidate.id, 0);
      return;
    }

    // non-bundled: decrement or remove
    updateQuantity(candidate.id, candidate.quantity - 1);
  };

  /* EMPTY CART */
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="serif-title text-3xl mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Discover Charbel Abdallah’s published works.</p>
          <Button
            onClick={() => setLocation("/books")}
            className="bg-black text-white hover:bg-[#d4af37] hover:text-black px-8"
          >
            Browse Books
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-12">
          <h1 className="serif-title text-4xl">Checkout</h1>

          {/* INFO */}
          <section className="space-y-6">
            <h2 className="serif-title text-2xl">Your Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 px-4 py-3"
              />
              <input
                required
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-300 px-4 py-3"
              />
              <input
                required
                placeholder="Phone Number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="border border-gray-300 px-4 py-3 md:col-span-2"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 px-4 py-3 md:col-span-2"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={() => setEmailOptIn(!emailOptIn)}
              />
              Receive news and offers
            </label>
          </section>

          {/* DELIVERY */}
          <section className="space-y-6">
            <h2 className="serif-title text-2xl">Delivery</h2>

            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={state.deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                />
                Pickup (Free)
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={state.deliveryMethod === "shipping"}
                  onChange={() => setDeliveryMethod("shipping")}
                />
                Delivery — North Lebanon $3 · Other regions $5
              </label>
            </div>

            {state.deliveryMethod === "shipping" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  required
                  value={state.governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="border border-gray-300 px-4 py-3"
                >
                  <option value="">Select Governorate</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <input
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border border-gray-300 px-4 py-3"
                />
                <input
                  required
                  placeholder="Full Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border border-gray-300 px-4 py-3 md:col-span-2"
                />
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="border border-gray-100 p-6 shadow-sm space-y-6 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="serif-title text-2xl">Order Summary</h2>

            <button
              type="button"
              onClick={() => setClearOpen(true)}
              className="text-xs font-medium text-gray-500 hover:text-black underline underline-offset-4"
            >
              Clear cart
            </button>
          </div>

          {groupedBooks.map((g) => (
            <div key={g.baseId} className="space-y-3">
              {/* BOOK ROW */}
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                  <img src={g.image} alt={g.title} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 space-y-2 text-sm">
                  <p className="font-medium">{g.title}</p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeOneFromGroup(g.baseId)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-6 text-center">{g.qty}</span>

                    <button
                      onClick={() =>
                        openFreebiePickerFromCart({
                          id: g.baseId,
                          title: g.title,
                          price: g.unitPrice,
                          image: g.image,
                          kind: "book",
                        })
                      }
                      className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <span className="text-sm font-medium">${g.unitPrice * g.qty}</span>
              </div>

              {/* FREEBIES */}
              {Array.from(g.gifts.values()).map((gift) => (
                <div key={gift.title} className="flex gap-4 items-center pl-2">
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                    <img
                      src={gift.image}
                      alt={gift.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-1 text-sm">
                    <p className="font-medium">
                      {gift.title}
                      <span className="ml-2 text-xs font-semibold text-[#d4af37]">
                        FREE GIFT
                      </span>
                    </p>
                    <div className="text-xs text-gray-500">Qty: {gift.qty}</div>
                  </div>

                  <span className="text-sm font-medium">FREE</span>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-3" />
            </div>
          ))}

          {accessoryLines.map((item: any) => (
  <div key={item.id} className="flex gap-4 items-center">
    <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
      <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
    </div>

    <div className="flex-1 space-y-2 text-sm">
      <p className="font-medium">{item.title}</p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white"
        >
          <Minus size={14} />
        </button>

        <span className="w-6 text-center">{item.quantity}</span>

        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>

    <span className="text-sm font-medium">${item.price * item.quantity}</span>
  </div>
))}


          <div className="border-t pt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>${deliveryCost}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>${total}</span>
          </div>

          <Button
            disabled={!isValid}
            onClick={handlePlaceOrder}
            className="w-full bg-black text-white hover:bg-[#d4af37] hover:text-black disabled:opacity-40"
          >
            Place Order
          </Button>
        </div>
      </div>

      {/* FREEBIE MODAL */}
      {freebieOpen && pendingBookItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setFreebieOpen(false)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-3xl bg-white border border-gray-100 shadow-xl p-5 md:p-8 max-h-[85vh] overflow-y-auto">
            <h3 className="serif-title text-2xl text-black mb-2">Choose your free gift</h3>

            <p className="sans-body text-gray-600 text-sm mb-6">
              Included with{" "}
              <span className="font-medium text-black">{pendingBookItem.title}</span>.
            </p>

            <div className="space-y-3">
              {FREEBIES[baseBookIdOf(pendingBookItem)]?.map((opt) => {
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
                      <img src={opt.image} alt={opt.title} className="h-full w-full object-contain" />
                    </div>

                    <span className="sans-body text-sm text-black">{opt.title}</span>
                  </label>
                );
              })}
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
                onClick={confirmFreebieFromCart}
                className="bg-black text-white hover:bg-[#d4af37] hover:text-black"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR CART MODAL */}
      {clearOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setClearOpen(false)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-md bg-white border border-gray-100 shadow-xl p-6">
            <h3 className="serif-title text-xl text-black mb-2">Clear your cart?</h3>
            <p className="sans-body text-sm text-gray-600">
              This will remove all items from your cart. This action can’t be undone.
            </p>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setClearOpen(false)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={confirmClearCart}
                className="bg-black text-white hover:bg-[#d4af37] hover:text-black"
              >
                Yes, clear cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

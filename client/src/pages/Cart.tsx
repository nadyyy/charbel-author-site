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
    updateQuantity,
    setDeliveryMethod,
    setGovernorate,
    subtotal,
    deliveryCost,
    total,
  } = useCart();

 

  // ✅ FORM STATE (MUST BE INSIDE COMPONENT)
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

  // ✅ WHATSAPP HANDLER
  const handlePlaceOrder = () => {
    if (!isValid) return;

    const itemsText = state.items
      .map(
        (i) =>
          `• ${i.title} × ${i.quantity} = $${i.price * i.quantity}`
      )
      .join("\n");

    const message = `
New Order 📦

Name: ${firstName} ${lastName}
Phone: ${phone}
Email: ${email || "-"}

Delivery: ${state.deliveryMethod}
Region: ${state.governorate || "Pickup"}
City: ${city || "-"}
Address: ${address || "-"}

Order:
${itemsText}

Subtotal: $${subtotal}
Delivery: $${deliveryCost}
Total: $${total}
`;

    const url = `https://wa.me/96176640164?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank");
  };
const [, setLocation] = useLocation();


  /* EMPTY CART */
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="serif-title text-3xl mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">
            Discover Charbel Abdallah’s published works.
          </p>
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
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
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
          <h2 className="serif-title text-2xl">Order Summary</h2>

          {state.items.map((item) => (
            <div key={item.id} className="flex gap-4 items-start">
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-auto object-contain"
              />

              <div className="flex-1 space-y-2 text-sm">
                <p className="font-medium">{item.title}</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="w-6 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-black hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <span className="text-sm font-medium">
                ${item.price * item.quantity}
              </span>
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
    </div>
  );
}

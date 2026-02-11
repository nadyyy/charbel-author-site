// src/contexts/CartContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

type DeliveryMethod = "pickup" | "shipping";

interface CartState {
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  governorate: string;
}

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  setGovernorate: (gov: string) => void;
  subtotal: number;
  deliveryCost: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "charbel-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({
    items: [],
    deliveryMethod: "pickup",
    governorate: "",
  });

useEffect(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // basic validation
      if (
        parsed &&
        Array.isArray(parsed.items) &&
        typeof parsed.deliveryMethod === "string"
      ) {
        setState(parsed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}, []);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setState((prev) => {
      const existing = prev.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...prev, items: [...prev.items, { ...item, quantity: 1 }] };
    });
  };

  const removeItem = (id: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

const updateQuantity = (id: number, qty: number) => {
  setState((prev) => ({
    ...prev,
    items:
      qty <= 0
        ? prev.items.filter((i) => i.id !== id)
        : prev.items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
  }));
};


  const setDeliveryMethod = (method: DeliveryMethod) =>
    setState((prev) => ({ ...prev, deliveryMethod: method }));

  const setGovernorate = (gov: string) =>
    setState((prev) => ({ ...prev, governorate: gov }));

  const subtotal = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const deliveryCost =
    state.deliveryMethod === "pickup"
      ? 0
      : state.governorate === "North Lebanon" ||
        state.governorate === "Batroun"
      ? 3
      : 5;

  const total = subtotal + deliveryCost;

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        setDeliveryMethod,
        setGovernorate,
        subtotal,
        deliveryCost,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

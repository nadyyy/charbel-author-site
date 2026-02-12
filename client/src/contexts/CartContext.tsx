// src/contexts/CartContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type DeliveryMethod = "pickup" | "shipping";
type CartItemKind = "book" | "accessory" | "gift";

export interface CartItem {
  id: string; // ✅ string ids everywhere
  title: string;
  price: number; // 0 for gifts
  quantity: number;
  image: string;

  // ✅ optional metadata
  kind?: CartItemKind;
  isGift?: boolean; // gift line that can't be removed alone
  parentId?: string; // book id that this gift is tied to

  // ✅ selected freebie label (stored on the book line)
  freebie?: string;
}

interface CartState {
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  governorate: string;
}

type AddableItem = Omit<CartItem, "quantity">;

type GiftChoice = {
  id: string; // internal gift id (not cart id)
  title: string;
  image: string;
};

interface CartContextType {
  state: CartState;

  addItem: (item: AddableItem) => void;
  addBookWithGift: (book: AddableItem, gift: GiftChoice) => void;

  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;

  clearCart: () => void;

  setDeliveryMethod: (method: DeliveryMethod) => void;
  setGovernorate: (gov: string) => void;

  subtotal: number;
  deliveryCost: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "charbel-cart";

function isValidSavedState(x: any): x is CartState {
  return (
    x &&
    Array.isArray(x.items) &&
    typeof x.deliveryMethod === "string" &&
    typeof x.governorate === "string"
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({
    items: [],
    deliveryMethod: "pickup",
    governorate: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (isValidSavedState(parsed)) setState(parsed);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const clearCart = () => {
    setState((prev) => ({ ...prev, items: [] }));
  };

  const addItem = (item: AddableItem) => {
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

  // ✅ Adds ONE book line (qty=1) + ONE linked gift line (qty=1)
  // ✅ Allows multiple copies of the same book with DIFFERENT gifts (separate bundles)
  const addBookWithGift = (book: AddableItem, gift: GiftChoice) => {
    setState((prev) => {
      const baseBookId = book.id;

      const unique =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const bookCartId = `${baseBookId}::book::${unique}`;
      const giftCartId = `${bookCartId}::gift::${gift.id}`;

      const bookItem: CartItem = {
        ...book,
        id: bookCartId,
        kind: book.kind ?? "book",
        quantity: 1,
      };

      const giftItem: CartItem = {
        id: giftCartId,
        title: gift.title,
        price: 0,
        quantity: 1,
        image: gift.image,
        kind: "gift",
        isGift: true,
        parentId: bookCartId,
      };

      return {
        ...prev,
        items: [...prev.items, bookItem, giftItem],
      };
    });
  };

  const removeItem = (id: string) => {
    setState((prev) => {
      const target = prev.items.find((i) => i.id === id);
      if (!target) return prev;

      if (target.isGift) return prev;

      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== id && i.parentId !== id),
      };
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    setState((prev) => {
      const target = prev.items.find((i) => i.id === id);
      if (!target) return prev;

      if (target.isGift) return prev;

      // ✅ If this item has a linked gift, don't allow qty > 1 (each bundle is qty=1)
      const hasLinkedGift = prev.items.some((i) => i.parentId === id && i.isGift);
      if (hasLinkedGift && qty > 1) return prev;

      if (qty <= 0) {
        return {
          ...prev,
          items: prev.items.filter((i) => i.id !== id && i.parentId !== id),
        };
      }

      const nextItems = prev.items.map((i) =>
        i.id === id ? { ...i, quantity: qty } : i
      );

      const isBook = (target.kind ?? "book") === "book";
      if (!isBook) return { ...prev, items: nextItems };

      const synced = nextItems.map((i) =>
        i.parentId === id ? { ...i, quantity: qty } : i
      );

      return { ...prev, items: synced };
    });
  };

  const setDeliveryMethod = (method: DeliveryMethod) =>
    setState((prev) => ({ ...prev, deliveryMethod: method }));

  const setGovernorate = (gov: string) =>
    setState((prev) => ({ ...prev, governorate: gov }));

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const deliveryCost =
    state.deliveryMethod === "pickup"
      ? 0
      : state.governorate === "North Lebanon" || state.governorate === "Batroun"
      ? 3
      : 5;

  const total = subtotal + deliveryCost;

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        addBookWithGift,
        removeItem,
        updateQuantity,
        clearCart,
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

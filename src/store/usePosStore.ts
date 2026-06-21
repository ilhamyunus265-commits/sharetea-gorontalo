import { create } from "zustand";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
};

export type CartItem = Product & { qty: number };

interface PosState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>((set) => ({
  cart: [],
  addToCart: (product) =>
    set((state) => {
      if (product.stock <= 0) return state; // Abaikan jika stok habis

      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          ),
        };
      }
      return { cart: [...state.cart, { ...product, qty: 1 }] };
    }),
  updateQty: (id, delta) =>
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      }),
    })),
  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    })),
  clearCart: () => set({ cart: [] }),
}));

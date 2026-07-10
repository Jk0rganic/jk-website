import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";

interface CartItem {
  id: string;
  databaseId: number;
  name: string;
  price: number;
  quantity: number;
  variation_id?: number;
  selectedSize?: string | null;
  image?: unknown;
}

interface CartStore {
  cartDetails: CartItem[];
  cartCount: number;
  totalPrice: number;
  updateTotals: () => void;
  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

interface PendingOrderStore {
  pendingOrder: unknown | null;
  setPendingOrder: (order: unknown) => void;
  clearPendingOrder: () => void;
}

interface CheckoutStore {
  savedUserInfo: Partial<CheckOutSchemaType> | null; // fixed: was unknown
  setSavedUserInfo: (data: Partial<CheckOutSchemaType> | null) => void;
  clearSavedUserInfo: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartDetails: [],
      cartCount: 0,
      totalPrice: 0,

      updateTotals: () => {
        const { cartDetails } = get();
        set({
          cartCount: cartDetails.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: cartDetails.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ),
        });
      },

      addToCart: (newProduct) => {
        const { cartDetails } = get();
        const existing = cartDetails.find((p) => p.id === newProduct.id);

        const updatedCart = existing
          ? cartDetails.map((p) =>
              p.id === newProduct.id
                ? { ...p, quantity: Math.min(p.quantity + 1, 10) }
                : p,
            )
          : [
              ...cartDetails,
              {
                ...newProduct,
                price: parseFloat(String(newProduct.price)) || 0,
                quantity: 1,
              },
            ];

        set({ cartDetails: updatedCart });
        get().updateTotals();
      },

      removeItem: (id) => {
        set({
          cartDetails: get().cartDetails.filter((item) => item.id !== id),
        });
        get().updateTotals();
      },

      setItemQuantity: (id, quantity) => {
        set({
          cartDetails: get().cartDetails.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, Math.min(quantity, 10)) }
              : item,
          ),
        });
        get().updateTotals();
      },

      clearCart: () => set({ cartDetails: [], cartCount: 0, totalPrice: 0 }),
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.updateTotals();
      },
    },
  ),
);

export const usePendingOrderStore = create<PendingOrderStore>()(
  persist(
    (set) => ({
      pendingOrder: null,

      setPendingOrder: (order) => set({ pendingOrder: order }),

      clearPendingOrder: () => set({ pendingOrder: null }),
    }),
    {
      name: "pending-order-storage",
    },
  ),
);

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      savedUserInfo: null,
      setSavedUserInfo: (data) => set({ savedUserInfo: data }),
      clearSavedUserInfo: () => set({ savedUserInfo: null }),
    }),
    { name: "checkout-user-info" },
  ),
);

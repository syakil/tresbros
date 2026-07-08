import { create } from 'zustand';
import type { Product } from '@/types/models';

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  notes: string;
  extraPrice: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  discountType: 'nominal' | 'percentage';
  discountAmount: number;
  appliedCoupon: { code: string; type: string; value: number } | null;
  taxEnabled: boolean;

  addItem: (product: Product, notes?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNotes: (cartItemId: string, notes: string, extraPrice?: number) => void;
  setCustomerName: (name: string) => void;
  setDiscountType: (type: 'nominal' | 'percentage') => void;
  setDiscountAmount: (amount: number) => void;
  setAppliedCoupon: (coupon: CartState['appliedCoupon'], discountAmount: number) => void;
  setTaxEnabled: (enabled: boolean) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: () => number;
  getTotal: () => number;
}

let cartItemCounter = 0;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  discountType: 'nominal',
  discountAmount: 0,
  appliedCoupon: null,
  taxEnabled: true,

  addItem: (product, notes = '') => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.product.id === product.id && i.notes === notes
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartItemId === existing.cartItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      cartItemCounter++;
      return {
        items: [
          ...state.items,
          {
            cartItemId: `cart-${cartItemCounter}`,
            product,
            quantity: 1,
            notes,
            extraPrice: 0,
          },
        ],
      };
    });
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      ),
    }));
  },

  updateNotes: (cartItemId, notes, extraPrice = 0) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.cartItemId === cartItemId ? { ...i, notes, extraPrice } : i
      ),
    }));
  },

  setCustomerName: (name) => set({ customerName: name }),
  setDiscountType: (type) => set({ discountType: type }),
  setDiscountAmount: (amount) => set({ discountAmount: amount }),
  setAppliedCoupon: (coupon, discountAmount) =>
    set({ appliedCoupon: coupon, discountAmount }),
  setTaxEnabled: (enabled) => set({ taxEnabled: enabled }),

  clearCart: () =>
    set({
      items: [],
      customerName: '',
      discountType: 'nominal',
      discountAmount: 0,
      appliedCoupon: null,
    }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce(
      (sum, item) => sum + (item.product.price + item.extraPrice) * item.quantity,
      0
    );
  },

  getDiscount: () => {
    const { discountType, discountAmount } = get();
    const subtotal = get().getSubtotal();
    if (discountType === 'percentage') {
      return Math.min((subtotal * discountAmount) / 100, subtotal);
    }
    return Math.min(discountAmount, subtotal);
  },

  getTax: () => {
    const { taxEnabled } = get();
    if (!taxEnabled) return 0;
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    return Math.round((subtotal - discount) * 0.11);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    const tax = get().getTax();
    return subtotal - discount + tax;
  },
}));

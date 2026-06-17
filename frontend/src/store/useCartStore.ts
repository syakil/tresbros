import { create } from 'zustand';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
  availableCount?: number | null;
  missingMaterials?: string[];
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  addItem: (product: Product, notes?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  discountType: 'nominal' | 'percentage';
  discountAmount: number;
  appliedCoupon: any | null;
  setDiscountType: (type: 'nominal' | 'percentage') => void;
  setDiscountAmount: (amount: number) => void;
  setAppliedCoupon: (coupon: any | null, discountAmount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getCalculatedDiscount: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  discountType: 'nominal',
  discountAmount: 0,
  appliedCoupon: null,
  
  setDiscountType: (type) => set({ discountType: type, discountAmount: 0, appliedCoupon: null }),
  setDiscountAmount: (amount) => set({ discountAmount: Math.max(0, amount), appliedCoupon: null }),
  setAppliedCoupon: (coupon, amount) => set({ appliedCoupon: coupon, discountType: 'nominal', discountAmount: amount }),
  
  addItem: (product, notes) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (i) => i.id === product.id && i.notes === notes
      );
      
      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += 1;
        return { items: newItems };
      }
      
      return { 
        items: [...state.items, { 
          ...product, 
          cartItemId: Math.random().toString(36).substr(2, 9), 
          quantity: 1, 
          notes 
        }] 
      };
    });
  },
  
  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.cartItemId !== cartItemId)
    }));
  },
  
  updateQuantity: (cartItemId, quantity) => {
    set((state) => ({
      items: state.items.map((i) => 
        i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    }));
  },
  
  setCustomerName: (name) => set({ customerName: name }),
  
  clearCart: () => set({ items: [], customerName: '', discountAmount: 0, discountType: 'nominal', appliedCoupon: null }),
  
  getSubtotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  getCalculatedDiscount: () => {
    const state = get();
    if (state.discountType === 'percentage') {
      return (state.getSubtotal() * state.discountAmount) / 100;
    }
    return state.discountAmount;
  },
  
  getTax: () => {
    const taxableAmount = Math.max(0, get().getSubtotal() - get().getCalculatedDiscount());
    return taxableAmount * 0.11; // 11% PB1 (Pajak Restoran)
  },
  
  getTotal: () => {
    const taxableAmount = Math.max(0, get().getSubtotal() - get().getCalculatedDiscount());
    return taxableAmount + get().getTax();
  }
}));

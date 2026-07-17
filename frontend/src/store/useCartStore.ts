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
  basePrice?: number;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerId?: number;
  addItem: (product: Product, notes?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  setCustomer: (name: string, id?: number, discountPercent?: number) => void;
  updateNotes: (cartItemId: string, notes: string, extraPrice?: number) => void;
  discountType: 'nominal' | 'percentage';
  discountAmount: number;
  appliedCoupon: any | null;
  taxEnabled: boolean;
  setTaxEnabled: (enabled: boolean) => void;
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
  customerId: undefined,
  discountType: 'nominal',
  discountAmount: 0,
  appliedCoupon: null,
  taxEnabled: true,
  
  setTaxEnabled: (enabled) => set({ taxEnabled: enabled }),
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
          notes,
          basePrice: product.price
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
  
  setCustomer: (name, id, discountPercent) => {
    set({ customerName: name, customerId: id });
    if (discountPercent && discountPercent > 0) {
      set({ discountType: 'percentage', discountAmount: discountPercent, appliedCoupon: null });
    } else {
      set({ discountType: 'nominal', discountAmount: 0 });
    }
  },
  
  updateNotes: (cartItemId, notes, extraPrice = 0) => {
    set((state) => ({
      items: state.items.map((i) => {
        if (i.cartItemId !== cartItemId) return i;
        
        const base = i.basePrice !== undefined ? i.basePrice : i.price;
        return { 
          ...i, 
          notes, 
          price: base + extraPrice, 
          basePrice: base 
        };
      })
    }));
  },
  
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
    const state = get();
    if (!state.taxEnabled) return 0;
    const taxableAmount = Math.max(0, state.getSubtotal() - state.getCalculatedDiscount());
    return taxableAmount * 0.11; // 11% PB1 (Pajak Restoran)
  },
  
  getTotal: () => {
    const taxableAmount = Math.max(0, get().getSubtotal() - get().getCalculatedDiscount());
    return taxableAmount + get().getTax();
  }
}));

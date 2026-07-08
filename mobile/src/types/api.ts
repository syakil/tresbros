export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    roleId: number;
    role: {
      id: number;
      name: string;
      permissions: string[];
    };
  };
}

export interface CreateOrderRequest {
  customerName?: string;
  paymentMethod: string;
  couponCode?: string;
  discountAmount?: number;
  totalAmount: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
    notes?: string;
  }[];
}

export interface CreatePurchaseRequest {
  supplierName: string;
  items: {
    materialId: number;
    quantity: number;
    price: number;
  }[];
}

export interface MaterialAdjustRequest {
  adjustType: 'in' | 'out';
  quantity: number;
  totalPrice: number;
  notes: string;
}

export interface ValidateCouponRequest {
  code: string;
  totalAmount: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: import('./models').Coupon;
  discountAmount: number;
}

export interface PromoteRnDRequest {
  price: number;
  categoryId: number;
  categoryName?: string;
}

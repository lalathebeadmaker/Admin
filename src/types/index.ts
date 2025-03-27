export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
}

export interface PurchaseHistory {
  id: string;
  quantity: number;
  totalCost: number;
  purchaseDate: Date;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
  lastPurchasePrice: number;
  lastPurchaseDate: Date;
  purchaseHistory: PurchaseHistory[];
}

export interface RawMaterialPurchase {
  id: string;
  materialId: string;
  quantity: number;
  price: number;
  purchaseDate: Date;
  purchasedBy: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  materials: ProductMaterial[];
}

export interface ProductMaterial {
  materialId: string;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: Date;
  shippingDate?: Date;
  trackingNumber?: string;
  notes?: string;
}

export interface Shipping {
  id: string;
  orderId: string;
  estimatedDeliveryDate: Date;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed';
  shippingAddress: string;
  shippingCost: number;
  shippingCostCurrency: 'USD' | 'NGN';
  recipientName: string;
  country: string;
  courier: string;
  trackingNumber: string;
} 
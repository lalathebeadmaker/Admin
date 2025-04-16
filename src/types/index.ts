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

export interface LaborCost {
  id: string;
  employeeName: string;
  monthlySalary: number;
  daysWorked: number;
  hoursPerDay: number;
  startDate: Date;
  endDate?: Date;
}

export interface CostCategory {
  id: string;
  name: string;
  description: string;
  type: 'raw_material' | 'labor' | 'other';
}

export interface ProductCost {
  categoryId: string;
  value: number;
}

export interface Product {
  id: string;
  name: string;
  baseCost?: number;
  materials: ProductMaterial[];
  costs: ProductCost[];
  timeToMake: number; // in days
}

export interface ProductMaterial {
  materialId: string;
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  additionalMaterials?: {
    materialId: string;
    quantity: number;
  }[];
  additionalCosts?: {
    name: string;
    amount: number;
  }[];
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ShippingInfo {
  customerPaid: number;
  actualCost?: number;
  trackingNumber?: string;
  carrier?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  socialMedia?: {
    platform: string;
    handle: string;
    url: string;
  }[];
  items: OrderItem[];
  totalAmount: number;
  currency: Currency;
  status: OrderStatus;
  orderDate: Date;
  expectedDeliveryDate: Date;
  realisticDeliveryDate: Date;
  notes?: string;
  shippingAddress: ShippingAddress;
  shippingInfo: ShippingInfo;
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
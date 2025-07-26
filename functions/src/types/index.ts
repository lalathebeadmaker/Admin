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
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
  CAD = 'CAD'
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
  dateShipped?: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingCompany?: string;
}

export interface CurrencyRate {
  currency: Currency;
  rateToNGN: number;
  lastUpdated: Date;
}

export interface ExtraExpense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: 'shipping' | 'materials' | 'labor' | 'other';
  notes?: string;
}

export interface AdditionalPayment {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'shipping' | 'product' | 'other';
  notes?: string;
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
  notes?: string;
  
  dateCompleted: Date;
  // Extra expenses and payments tracking
  extraExpenses?: ExtraExpense[];
  additionalPayments?: AdditionalPayment[];
  totalExtraExpenses?: number;
  totalAdditionalPayments?: number;
  // Financial calculations
  productCostInNGN?: number;
  shippingCostInNGN?: number;
  profitMargin?: number;
  // Product validation
  hasInvalidProducts?: boolean;
  shipping: Shipping; 
}

export interface Shipping {
  shippingAddress: ShippingAddress;
  shippingInfo: ShippingInfo;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed';
} 

export interface MetaEntry {
    key: string;
    value: string;
  }

export interface LineItem {
    product_id: number;
    meta_data?: MetaEntry[];
    quantity: number;
    price: string; // from WooCommerce API
}
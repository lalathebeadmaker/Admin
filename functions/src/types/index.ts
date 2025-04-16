export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: FirebaseFirestore.Timestamp;
  notes?: string;
  shippingAddress: ShippingAddress;
} 
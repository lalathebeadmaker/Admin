import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus } from '../types';

// Helper function to convert Firestore data to proper JavaScript objects
const convertFirestoreData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const converted: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      // Convert Firestore Timestamp to JavaScript Date
      converted[key] = value.toDate();
    } else if (Array.isArray(value)) {
      // Handle arrays
      converted[key] = value.map(item => convertFirestoreData(item));
    } else if (value && typeof value === 'object') {
      // Handle nested objects
      converted[key] = convertFirestoreData(value);
    } else {
      // Keep other values as is
      converted[key] = value;
    }
  }
  
  return converted;
};

export const ordersService = {
  // Get all orders
  async getOrders() {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'orders'),
        orderBy('orderDate', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertFirestoreData(data)
      } as Order;
    });
  },

  // Get a single order
  async getOrder(id: string) {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...convertFirestoreData(data)
      } as Order;
    }
    return null;
  },

  // Add new order
  async addOrder(order: Omit<Order, 'id'>) {
    const docRef = await addDoc(collection(db, 'orders'), order);
    return docRef.id;
  },

  // Update order
  async updateOrder(id: string, order: Partial<Order>) {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, order);
  },

  // Update order status
  async updateOrderStatus(id: string, status: OrderStatus) {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, { status });
  },

  // Get orders by status
  async getOrdersByStatus(status: OrderStatus) {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'orders'),
        where('status', '==', status),
        orderBy('orderDate', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertFirestoreData(data)
      } as Order;
    });
  }
}; 
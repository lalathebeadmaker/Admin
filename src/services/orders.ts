import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, OrderStatus } from '../types';

export const ordersService = {
  // Get all orders
  async getOrders() {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'orders'),
        orderBy('orderDate', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  },

  // Get a single order
  async getOrder(id: string) {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Order;
    }
    return null;
  },

  // Add new order
  async addOrder(order: Omit<Order, 'id'>) {
    const docRef = await addDoc(collection(db, 'orders'), order);
    return docRef.id;
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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
  }
}; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../types';

export const productsService = {
  // Get all products
  async getProducts() {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  },

  // Get a single product
  async getProduct(id: string) {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Product;
    }
    return null;
  },

  // Add new product
  async addProduct(product: Omit<Product, 'id'>) {
    const docRef = await addDoc(collection(db, 'products'), product);
    return docRef.id;
  },

  // Update product
  async updateProduct(id: string, product: Partial<Product>) {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, product);
  },

  // Delete product
  async deleteProduct(id: string) {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  }
}; 
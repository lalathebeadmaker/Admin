import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LaborCost } from '../types';

export const laborCostsService = {
  // Get all labor costs
  async getLaborCosts() {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'laborCosts'),
        orderBy('startDate', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LaborCost[];
  },

  // Get a single labor cost
  async getLaborCost(id: string) {
    const docRef = doc(db, 'laborCosts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as LaborCost;
    }
    return null;
  },

  // Add new labor cost
  async addLaborCost(laborCost: Omit<LaborCost, 'id'>) {
    const docRef = await addDoc(collection(db, 'laborCosts'), laborCost);
    return docRef.id;
  },

  // Update labor cost
  async updateLaborCost(id: string, laborCost: Partial<LaborCost>) {
    const docRef = doc(db, 'laborCosts', id);
    await updateDoc(docRef, laborCost);
  },

  // Delete labor cost
  async deleteLaborCost(id: string) {
    const docRef = doc(db, 'laborCosts', id);
    await deleteDoc(docRef);
  }
}; 
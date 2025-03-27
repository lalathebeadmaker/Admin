import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RawMaterial, RawMaterialPurchase } from '../types';

export const rawMaterialsService = {
  // Get all raw materials
  async getRawMaterials() {
    const querySnapshot = await getDocs(collection(db, 'rawMaterials'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RawMaterial[];
  },

  // Get raw material purchases
  async getRawMaterialPurchases() {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'rawMaterialPurchases'),
        orderBy('purchaseDate', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RawMaterialPurchase[];
  },

  // Add new raw material purchase
  async addRawMaterialPurchase(purchase: Omit<RawMaterialPurchase, 'id'>) {
    const docRef = await addDoc(collection(db, 'rawMaterialPurchases'), {
      ...purchase,
      purchaseDate: serverTimestamp()
    });

    // Update the last purchase price and date in the raw material document
    const materialRef = doc(db, 'rawMaterials', purchase.materialId);
    await updateDoc(materialRef, {
      lastPurchasePrice: purchase.price,
      lastPurchaseDate: serverTimestamp()
    });

    return docRef.id;
  },

  // Add new raw material
  async addRawMaterial(material: Omit<RawMaterial, 'id'>) {
    const docRef = await addDoc(collection(db, 'rawMaterials'), {
      ...material,
      lastPurchaseDate: serverTimestamp()
    });
    return docRef.id;
  }
}; 
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Ingredient } from '../types';

const COL = 'ingredients';

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ingredient));
  } catch (err) {
    console.error('[ingredientService] getIngredients:', err);
    throw err;
  }
}

export async function getIngredient(id: string): Promise<Ingredient | null> {
  try {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Ingredient) : null;
  } catch (err) {
    console.error('[ingredientService] getIngredient:', err);
    throw err;
  }
}

export async function addIngredient(data: Omit<Ingredient, 'id'>): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), data);
    return ref.id;
  } catch (err) {
    console.error('[ingredientService] addIngredient:', err);
    throw err;
  }
}

export async function updateIngredient(
  id: string,
  updates: Partial<Omit<Ingredient, 'id'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), updates);
  } catch (err) {
    console.error('[ingredientService] updateIngredient:', err);
    throw err;
  }
}

export async function deleteIngredient(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (err) {
    console.error('[ingredientService] deleteIngredient:', err);
    throw err;
  }
}

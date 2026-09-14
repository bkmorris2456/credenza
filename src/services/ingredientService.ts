import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Ingredient } from '../types';

const ingredientsCol = (householdId: string) =>
  collection(db, 'households', householdId, 'ingredients');

const ingredientDoc = (householdId: string, id: string) =>
  doc(db, 'households', householdId, 'ingredients', id);

export async function getIngredients(householdId: string): Promise<Ingredient[]> {
  try {
    const snap = await getDocs(query(ingredientsCol(householdId), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ingredient));
  } catch (err) {
    console.error('[ingredientService] getIngredients:', err);
    throw err;
  }
}

/**
 * Live-updating equivalent of getIngredients. Paints instantly from the
 * device's local Firestore cache (if present) and again whenever server
 * data changes, instead of waiting on a network round trip every load.
 * Returns an unsubscribe function.
 */
export function subscribeIngredients(
  householdId: string,
  onData: (ingredients: Ingredient[]) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(
    query(ingredientsCol(householdId), orderBy('name')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ingredient))),
    (err) => {
      console.error('[ingredientService] subscribeIngredients:', err);
      onError(err);
    }
  );
}

export async function getIngredient(
  householdId: string,
  id: string
): Promise<Ingredient | null> {
  try {
    const snap = await getDoc(ingredientDoc(householdId, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Ingredient) : null;
  } catch (err) {
    console.error('[ingredientService] getIngredient:', err);
    throw err;
  }
}

export async function addIngredient(
  householdId: string,
  data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const ref = await addDoc(ingredientsCol(householdId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error('[ingredientService] addIngredient:', err);
    throw err;
  }
}

export async function updateIngredient(
  householdId: string,
  id: string,
  updates: Partial<Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    await updateDoc(ingredientDoc(householdId, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[ingredientService] updateIngredient:', err);
    throw err;
  }
}

export async function deleteIngredient(householdId: string, id: string): Promise<void> {
  try {
    await deleteDoc(ingredientDoc(householdId, id));
  } catch (err) {
    console.error('[ingredientService] deleteIngredient:', err);
    throw err;
  }
}

export async function deleteIngredients(householdId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(ingredientDoc(householdId, id)));
    await batch.commit();
  } catch (err) {
    console.error('[ingredientService] deleteIngredients:', err);
    throw err;
  }
}

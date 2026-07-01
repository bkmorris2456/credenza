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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Recipe } from '../types';

const COL = 'recipes';

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe));
  } catch (err) {
    console.error('[recipeService] getRecipes:', err);
    throw err;
  }
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  try {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Recipe) : null;
  } catch (err) {
    console.error('[recipeService] getRecipe:', err);
    throw err;
  }
}

export async function addRecipe(data: Omit<Recipe, 'id' | 'created'>): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      created: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error('[recipeService] addRecipe:', err);
    throw err;
  }
}

export async function updateRecipe(
  id: string,
  updates: Partial<Omit<Recipe, 'id' | 'created'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), updates);
  } catch (err) {
    console.error('[recipeService] updateRecipe:', err);
    throw err;
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (err) {
    console.error('[recipeService] deleteRecipe:', err);
    throw err;
  }
}

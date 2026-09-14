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
import type { Recipe } from '../types';

const recipesCol = (householdId: string) =>
  collection(db, 'households', householdId, 'recipes');

const recipeDoc = (householdId: string, id: string) =>
  doc(db, 'households', householdId, 'recipes', id);

export async function getRecipes(householdId: string): Promise<Recipe[]> {
  try {
    const snap = await getDocs(query(recipesCol(householdId), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe));
  } catch (err) {
    console.error('[recipeService] getRecipes:', err);
    throw err;
  }
}

/** Live-updating equivalent of getRecipes; see subscribeIngredients for why. */
export function subscribeRecipes(
  householdId: string,
  onData: (recipes: Recipe[]) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(
    query(recipesCol(householdId), orderBy('name')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe))),
    (err) => {
      console.error('[recipeService] subscribeRecipes:', err);
      onError(err);
    }
  );
}

export async function getRecipe(householdId: string, id: string): Promise<Recipe | null> {
  try {
    const snap = await getDoc(recipeDoc(householdId, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Recipe) : null;
  } catch (err) {
    console.error('[recipeService] getRecipe:', err);
    throw err;
  }
}

export async function addRecipe(
  householdId: string,
  data: Omit<Recipe, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const ref = await addDoc(recipesCol(householdId), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error('[recipeService] addRecipe:', err);
    throw err;
  }
}

export async function updateRecipe(
  householdId: string,
  id: string,
  updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await updateDoc(recipeDoc(householdId, id), updates);
  } catch (err) {
    console.error('[recipeService] updateRecipe:', err);
    throw err;
  }
}

export async function deleteRecipe(householdId: string, id: string): Promise<void> {
  try {
    await deleteDoc(recipeDoc(householdId, id));
  } catch (err) {
    console.error('[recipeService] deleteRecipe:', err);
    throw err;
  }
}

export async function deleteRecipes(householdId: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(recipeDoc(householdId, id)));
    await batch.commit();
  } catch (err) {
    console.error('[recipeService] deleteRecipes:', err);
    throw err;
  }
}

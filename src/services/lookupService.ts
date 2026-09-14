import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Category, Unit } from '../types';

type LookupKind = 'categories' | 'units';

const lookupCol = (householdId: string, kind: LookupKind) =>
  collection(db, 'households', householdId, kind);

async function getLookup<T extends { id: string; name: string }>(
  householdId: string,
  kind: LookupKind
): Promise<T[]> {
  const snap = await getDocs(query(lookupCol(householdId, kind), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

/** Live-updating equivalent of getLookup; see subscribeIngredients for why. */
function subscribeLookup<T extends { id: string; name: string }>(
  householdId: string,
  kind: LookupKind,
  onData: (items: T[]) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(
    query(lookupCol(householdId, kind), orderBy('name')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))),
    (err) => {
      console.error(`[lookupService] subscribe${kind}:`, err);
      onError(err);
    }
  );
}

/** Doc id === trimmed name, so re-adding an existing name is a harmless no-op. */
async function addLookup<T extends { id: string; name: string }>(
  householdId: string,
  kind: LookupKind,
  name: string
): Promise<T> {
  const trimmed = name.trim();
  await setDoc(
    doc(db, 'households', householdId, kind, trimmed),
    { name: trimmed, createdAt: serverTimestamp() },
    { merge: true }
  );
  return { id: trimmed, name: trimmed } as T;
}

export async function getCategories(householdId: string): Promise<Category[]> {
  try {
    return await getLookup<Category>(householdId, 'categories');
  } catch (err) {
    console.error('[lookupService] getCategories:', err);
    throw err;
  }
}

export function subscribeCategories(
  householdId: string,
  onData: (categories: Category[]) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeLookup<Category>(householdId, 'categories', onData, onError);
}

export async function addCategory(householdId: string, name: string): Promise<Category> {
  try {
    return await addLookup<Category>(householdId, 'categories', name);
  } catch (err) {
    console.error('[lookupService] addCategory:', err);
    throw err;
  }
}

export async function getUnits(householdId: string): Promise<Unit[]> {
  try {
    return await getLookup<Unit>(householdId, 'units');
  } catch (err) {
    console.error('[lookupService] getUnits:', err);
    throw err;
  }
}

export function subscribeUnits(
  householdId: string,
  onData: (units: Unit[]) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeLookup<Unit>(householdId, 'units', onData, onError);
}

export async function addUnit(householdId: string, name: string): Promise<Unit> {
  try {
    return await addLookup<Unit>(householdId, 'units', name);
  } catch (err) {
    console.error('[lookupService] addUnit:', err);
    throw err;
  }
}

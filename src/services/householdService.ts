import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Household, UserProfile } from '../types';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
  } catch (err) {
    console.error('[householdService] getUserProfile:', err);
    throw err;
  }
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  try {
    const snap = await getDoc(doc(db, 'households', householdId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Household) : null;
  } catch (err) {
    console.error('[householdService] getHousehold:', err);
    throw err;
  }
}

async function createHousehold(
  userId: string,
  email: string,
  displayName: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'households'), {
    name: `${displayName}'s Kitchen`,
    createdByUserId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'households', ref.id, 'members', userId), {
    role: 'owner',
    joinedAt: serverTimestamp(),
    displayName,
    email,
  });

  return ref.id;
}

/**
 * Loads the signed-in user's profile, bootstrapping both the profile
 * document and a starter household on first sign-in. Returns the id of
 * the household that should be active for this session.
 */
export async function ensureHousehold(
  userId: string,
  email: string,
  displayName: string
): Promise<string> {
  try {
    const profile = await getUserProfile(userId);
    if (profile?.activeHouseholdId) {
      return profile.activeHouseholdId;
    }

    const householdId = await createHousehold(userId, email, displayName);

    await setDoc(doc(db, 'users', userId), {
      name: displayName,
      email,
      activeHouseholdId: householdId,
    });

    return householdId;
  } catch (err) {
    console.error('[householdService] ensureHousehold:', err);
    throw err;
  }
}

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
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

export async function updateExpiryWarningDays(
  householdId: string,
  days: number
): Promise<void> {
  try {
    await updateDoc(doc(db, 'households', householdId), {
      expiryWarningDays: days,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[householdService] updateExpiryWarningDays:', err);
    throw err;
  }
}

/**
 * Loads the signed-in user's profile, bootstrapping both the profile
 * document and a starter household on first sign-in. Returns the id of
 * the household that should be active for this session.
 *
 * The check-then-create runs inside a Firestore transaction so that
 * concurrent calls for the same user (e.g. StrictMode's double-mount, or
 * overlapping auth-state events) can never create more than one
 * household: Firestore aborts and retries whichever transaction loses
 * the race, and the retry sees the winner's activeHouseholdId already set.
 *
 * If activeHouseholdId is already set but its membership doc is missing
 * (e.g. left over from a pre-transaction race), the membership doc is
 * repaired in place rather than minting a second household. The household
 * doc itself is repaired the same way, in case it predates the household
 * doc being created alongside the membership doc.
 */
export async function ensureHousehold(
  userId: string,
  email: string,
  displayName: string
): Promise<string> {
  try {
    const userRef = doc(db, 'users', userId);

    return await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const existingId = userSnap.data()?.activeHouseholdId as string | undefined;
      if (existingId) {
        // Firestore transactions require all reads to happen before any
        // writes, so both docs are read here before either is repaired.
        const householdRef = doc(db, 'households', existingId);
        const memberRef = doc(db, 'households', existingId, 'members', userId);
        const [householdSnap, memberSnap] = await Promise.all([
          tx.get(householdRef),
          tx.get(memberRef),
        ]);

        if (!householdSnap.exists()) {
          tx.set(householdRef, {
            name: `${displayName}'s Kitchen`,
            createdByUserId: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        if (!memberSnap.exists()) {
          tx.set(memberRef, {
            role: 'owner',
            joinedAt: serverTimestamp(),
            displayName,
            email,
          });
        }
        return existingId;
      }

      const householdRef = doc(collection(db, 'households'));
      tx.set(householdRef, {
        name: `${displayName}'s Kitchen`,
        createdByUserId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(doc(db, 'households', householdRef.id, 'members', userId), {
        role: 'owner',
        joinedAt: serverTimestamp(),
        displayName,
        email,
      });

      tx.set(userRef, {
        name: displayName,
        email,
        activeHouseholdId: householdRef.id,
      });

      return householdRef.id;
    });
  } catch (err) {
    console.error('[householdService] ensureHousehold:', err);
    throw err;
  }
}

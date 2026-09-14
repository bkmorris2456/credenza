import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Household, UserProfile, UserHouseholdMembership } from '../types';

const JOIN_CODE_LENGTH = 8;
/** Firestore caps a single batch at 500 writes; stay comfortably under that. */
const COPY_BATCH_SIZE = 450;

function generateJoinCode(): string {
  const min = 10 ** (JOIN_CODE_LENGTH - 1);
  const max = 10 ** JOIN_CODE_LENGTH - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

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
 * document and a starter household on first sign-in. Returns the household
 * that should be active for this session, so callers don't need a second,
 * separate getHousehold round trip right after.
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
 *
 * Note: when a household or membership doc has to be freshly created here,
 * the returned household's createdAt/updatedAt are approximated with a
 * client-side Timestamp.now() rather than the real serverTimestamp() value
 * (which isn't known until after commit) — a one-time, millisecond-scale
 * imprecision on the rare first-login/repair path, and nothing in the UI
 * currently reads those fields anyway.
 */
export async function ensureHousehold(
  userId: string,
  email: string,
  displayName: string
): Promise<{ householdId: string; household: Household }> {
  try {
    const userRef = doc(db, 'users', userId);

    return await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      const existingId = userSnap.data()?.activeHouseholdId as string | undefined;
      if (existingId) {
        // Firestore transactions require all reads to happen before any
        // writes, so all docs are read here before any is repaired.
        const householdRef = doc(db, 'households', existingId);
        const memberRef = doc(db, 'households', existingId, 'members', userId);
        const indexRef = doc(db, 'users', userId, 'households', existingId);
        const [householdSnap, memberSnap, indexSnap] = await Promise.all([
          tx.get(householdRef),
          tx.get(memberRef),
          tx.get(indexRef),
        ]);

        let household: Household;
        if (householdSnap.exists()) {
          household = { id: existingId, ...householdSnap.data() } as Household;
        } else {
          household = {
            id: existingId,
            name: 'Personal',
            createdByUserId: userId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };
          tx.set(householdRef, {
            name: household.name,
            createdByUserId: household.createdByUserId,
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
        // Backfills the households index for accounts created before this
        // feature existed; only written once, so it doesn't stomp joinedAt.
        if (!indexSnap.exists()) {
          tx.set(indexRef, { name: household.name, joinedAt: serverTimestamp() });
        }
        return { householdId: existingId, household };
      }

      const householdRef = doc(collection(db, 'households'));
      const household: Household = {
        id: householdRef.id,
        name: 'Personal',
        createdByUserId: userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      tx.set(householdRef, {
        name: household.name,
        createdByUserId: household.createdByUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(doc(db, 'households', householdRef.id, 'members', userId), {
        role: 'owner',
        joinedAt: serverTimestamp(),
        displayName,
        email,
      });

      tx.set(doc(db, 'users', userId, 'households', householdRef.id), {
        name: 'Personal',
        joinedAt: serverTimestamp(),
      });

      tx.set(userRef, {
        name: displayName,
        email,
        activeHouseholdId: householdRef.id,
      });

      return { householdId: householdRef.id, household };
    });
  } catch (err) {
    console.error('[householdService] ensureHousehold:', err);
    throw err;
  }
}

export async function listUserHouseholds(userId: string): Promise<UserHouseholdMembership[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'users', userId, 'households'), orderBy('joinedAt'))
    );
    return snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as UserHouseholdMembership)
    );
  } catch (err) {
    console.error('[householdService] listUserHouseholds:', err);
    throw err;
  }
}

export async function switchActiveHousehold(userId: string, householdId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { activeHouseholdId: householdId });
  } catch (err) {
    console.error('[householdService] switchActiveHousehold:', err);
    throw err;
  }
}

/**
 * Creates a brand-new, shareable household with a generated 8-digit join
 * code, and makes the caller its owner.
 */
export async function createHousehold(
  userId: string,
  name: string,
  displayName: string,
  email: string
): Promise<{ householdId: string; joinCode: string }> {
  try {
    let joinCode = generateJoinCode();
    // Collisions are astronomically unlikely (1 in 10^8 codes in use), but
    // check anyway so we never silently hand out a code that's already taken.
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await getDoc(doc(db, 'joinCodes', joinCode));
      if (!existing.exists()) break;
      joinCode = generateJoinCode();
    }

    const householdRef = doc(collection(db, 'households'));
    const batch = writeBatch(db);

    batch.set(householdRef, {
      name,
      createdByUserId: userId,
      joinCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'households', householdRef.id, 'members', userId), {
      role: 'owner',
      joinedAt: serverTimestamp(),
      displayName,
      email,
    });
    batch.set(doc(db, 'joinCodes', joinCode), {
      householdId: householdRef.id,
      householdName: name,
    });
    batch.set(doc(db, 'users', userId, 'households', householdRef.id), {
      name,
      joinedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', userId), { activeHouseholdId: householdRef.id });

    await batch.commit();
    return { householdId: householdRef.id, joinCode };
  } catch (err) {
    console.error('[householdService] createHousehold:', err);
    throw err;
  }
}

/**
 * Joins an existing household via its 8-digit code. Optionally copies the
 * caller's ingredients and recipes from their current active household into
 * the newly joined one, leaving the source household's data untouched.
 */
export async function joinHouseholdByCode(
  userId: string,
  code: string,
  displayName: string,
  email: string,
  currentHouseholdId: string | null,
  migrateExistingData: boolean
): Promise<string> {
  try {
    const codeSnap = await getDoc(doc(db, 'joinCodes', code));
    if (!codeSnap.exists()) {
      throw new Error('Invalid join code.');
    }
    const { householdId, householdName } = codeSnap.data() as {
      householdId: string;
      householdName: string;
    };

    const memberRef = doc(db, 'households', householdId, 'members', userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      const batch = writeBatch(db);
      batch.set(memberRef, {
        role: 'member',
        joinedAt: serverTimestamp(),
        displayName,
        email,
      });
      batch.set(doc(db, 'users', userId, 'households', householdId), {
        name: householdName,
        joinedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', userId), { activeHouseholdId: householdId });
      await batch.commit();
    } else {
      await updateDoc(doc(db, 'users', userId), { activeHouseholdId: householdId });
    }

    if (migrateExistingData && currentHouseholdId && currentHouseholdId !== householdId) {
      await copyHouseholdData(currentHouseholdId, householdId);
    }

    return householdId;
  } catch (err) {
    console.error('[householdService] joinHouseholdByCode:', err);
    throw err;
  }
}

/** Copies (not moves) every ingredient and recipe from one household into another. */
async function copyHouseholdData(fromHouseholdId: string, toHouseholdId: string): Promise<void> {
  const [ingredientsSnap, recipesSnap] = await Promise.all([
    getDocs(collection(db, 'households', fromHouseholdId, 'ingredients')),
    getDocs(collection(db, 'households', fromHouseholdId, 'recipes')),
  ]);

  const operations: { ref: ReturnType<typeof doc>; data: Record<string, unknown> }[] = [];

  ingredientsSnap.docs.forEach((d) => {
    operations.push({
      ref: doc(collection(db, 'households', toHouseholdId, 'ingredients')),
      data: { ...d.data(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    });
  });

  recipesSnap.docs.forEach((d) => {
    operations.push({
      ref: doc(collection(db, 'households', toHouseholdId, 'recipes')),
      data: { ...d.data(), createdAt: serverTimestamp() },
    });
  });

  for (const group of chunk(operations, COPY_BATCH_SIZE)) {
    const batch = writeBatch(db);
    group.forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }
}

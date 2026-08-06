import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (err) {
    console.error('[authService] signIn:', err);
    throw err;
  }
}

export async function register(email: string, password: string): Promise<User> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  } catch (err) {
    console.error('[authService] register:', err);
    throw err;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('[authService] logOut:', err);
    throw err;
  }
}

/** Returns an unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** First name/word from displayName, or the local part of the email, for compact "Added By" style labels. */
export function shortDisplayName(user: User): string {
  const source = user.displayName || user.email || 'Unknown';
  return source.split(/[\s@]/)[0] || 'Unknown';
}

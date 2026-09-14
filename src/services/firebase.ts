import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  const message = `Firebase config is missing: ${missingKeys.join(', ')}. Copy .env.example to .env and fill in your Firebase project credentials, then restart the dev server.`;
  console.error('[firebase]', message);
  throw new Error(message);
}

const app = initializeApp(firebaseConfig);

// Persistent (IndexedDB-backed) cache so each device keeps its own copy of
// Firestore data between sessions instead of re-fetching from the network
// every load; multi-tab support in case Credenza is open in two tabs at once.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const auth = getAuth(app);

// Messaging is only available in contexts that support service workers
export const messaging = isSupported().then((ok) =>
  ok ? getMessaging(app) : null
);

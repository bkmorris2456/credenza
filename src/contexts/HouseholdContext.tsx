import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ensureHousehold } from '../services/householdService';

interface HouseholdContextValue {
  householdId: string | null;
  loading: boolean;
  error: string | null;
}

const HouseholdContext = createContext<HouseholdContextValue>({
  householdId: null,
  loading: true,
  error: null,
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setHouseholdId(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const id = await ensureHousehold(
          user.uid,
          user.email ?? '',
          user.displayName ?? user.email ?? 'My'
        );
        if (!cancelled) setHouseholdId(id);
      } catch (err) {
        console.error('[HouseholdContext] ensureHousehold failed:', err);
        if (!cancelled) setError('Failed to load your household. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <HouseholdContext.Provider value={{ householdId, loading, error }}>
      {children}
    </HouseholdContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is co-located with its provider
export function useHousehold() {
  return useContext(HouseholdContext);
}

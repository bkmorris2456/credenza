import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  ensureHousehold,
  getHousehold,
  switchActiveHousehold,
  updateExpiryWarningDays,
} from '../services/householdService';
import type { Household } from '../types';

interface HouseholdContextValue {
  householdId: string | null;
  household: Household | null;
  loading: boolean;
  error: string | null;
  setExpiryWarningDays: (days: number) => Promise<void>;
  /** Makes householdId the active household app-wide (after a create/join/switch action elsewhere). */
  switchHousehold: (householdId: string) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue>({
  householdId: null,
  household: null,
  loading: true,
  error: null,
  setExpiryWarningDays: async () => {},
  switchHousehold: async () => {},
});

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setHouseholdId(null);
        setHousehold(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { householdId, household } = await ensureHousehold(
          user.uid,
          user.email ?? '',
          user.displayName ?? user.email ?? 'My'
        );
        if (cancelled) return;
        setHouseholdId(householdId);
        setHousehold(household);
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

  const setExpiryWarningDays = async (days: number) => {
    if (!householdId) return;
    await updateExpiryWarningDays(householdId, days);
    setHousehold((prev) => (prev ? { ...prev, expiryWarningDays: days } : prev));
  };

  const switchHousehold = async (id: string) => {
    if (!user) return;
    await switchActiveHousehold(user.uid, id);
    const data = await getHousehold(id);
    setHouseholdId(id);
    setHousehold(data);
  };

  return (
    <HouseholdContext.Provider
      value={{ householdId, household, loading, error, setExpiryWarningDays, switchHousehold }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is co-located with its provider
export function useHousehold() {
  return useContext(HouseholdContext);
}

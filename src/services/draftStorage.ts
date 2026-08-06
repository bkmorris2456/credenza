/**
 * Session-scoped (survives a refresh, clears when the tab closes) storage
 * for in-progress add/edit form state, so an accidental reload doesn't
 * lose what the user was typing.
 */

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error('[draftStorage] loadDraft failed:', err);
    return null;
  }
}

export function saveDraft<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('[draftStorage] saveDraft failed:', err);
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (err) {
    console.error('[draftStorage] clearDraft failed:', err);
  }
}

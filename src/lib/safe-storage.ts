/** Storage is optional. A quota/privacy error must never trap someone in a practice. */
export function readStoredArray<T>(storage: Pick<Storage, "getItem"> | undefined, key: string, valid: (value: unknown) => value is T): T[] {
  try {
    const raw = storage?.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(valid) : [];
  } catch {
    return [];
  }
}

export function writeStoredJson(storage: Pick<Storage, "setItem"> | undefined, key: string, value: unknown): boolean {
  try {
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Do not retry the same failing write in catch, and never claim that it was saved.
    return false;
  }
}

export function browserLocalStorage(): Storage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; }
  catch { return undefined; }
}

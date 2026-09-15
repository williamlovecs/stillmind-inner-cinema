/** One shared open, but a transient failure must not poison every later call for the app's lifetime.
 * Kept free of react-native imports so the retry semantics stay unit-testable in node.
 */
export function createDatabaseOpener<T>(open: () => Promise<T>): () => Promise<T> {
  let openPromise: Promise<T> | undefined;
  return () => {
    openPromise ??= open().catch((error: unknown) => {
      openPromise = undefined;
      throw error;
    });
    return openPromise;
  };
}

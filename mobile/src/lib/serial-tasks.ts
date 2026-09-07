/** Ordered persistence: a failed write must not poison later deletes or retries. */
export function createSerialTaskQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const result = tail.then(task);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}

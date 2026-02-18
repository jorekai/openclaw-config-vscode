export function createSerializedRunner<T>(
  task: (input: T) => Promise<void>,
): (input: T) => Promise<void> {
  let queue: Promise<void> = Promise.resolve();

  return async (input: T): Promise<void> => {
    const run = queue.catch(() => undefined).then(() => task(input));
    queue = run;
    await run;
  };
}

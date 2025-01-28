import { type PromiseLikeOrValue } from '../types/promise-like-or-value.js';

/**
 * Runs a function receiving an `AbortSignal` which is aborted when the optionally given `signal` aborts, or, when the function's result _resolves_.
 *
 * @example
 *
 * ```ts
 * const result = await runInAbortableContext(async (signal: AbortSignal) => {
 *   return Promise.race([
 *     block(async () => (await fetch('https://api.com/images', { signal })).json()),
 *     block(async () => (await fetch('https://api.com/musics', { signal })).json()),
 *   ]);
 * });
 * ```
 *
 * Because we `race`, when any of the 2 requests resolves (_fulfilled_ or _rejected_),
 * the `signal` is aborted, thus cancelling the other request.
 */
export async function runInAbortableContext<GReturn>(
  fnc: (signal: AbortSignal) => PromiseLikeOrValue<GReturn>,
  signal?: AbortSignal,
): Promise<GReturn> {
  signal?.throwIfAborted();

  const controller: AbortController = new AbortController();

  try {
    return await fnc(
      signal === undefined ? controller.signal : AbortSignal.any([signal, controller.signal]),
    );
  } finally {
    controller.abort();
  }
}

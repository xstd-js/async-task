import { CompleteError } from '@xstd/custom-error';
import { type AsyncRead } from '../../async-read.js';

/**
 * @experimental
 */
export function asyncReadFromAsyncIterator<GValue>(
  iterator: AsyncIterator<GValue>,
): AsyncRead<GValue> {
  return async (signal?: AbortSignal): Promise<GValue> => {
    signal?.throwIfAborted();
    const result: IteratorResult<GValue> = await iterator.next();
    if (result.done) {
      throw new CompleteError();
    } else {
      return result.value;
    }
  };
}

import { CompleteError } from '@xstd/custom-error';
import { type AsyncRead } from '../../async-read.js';

export async function* asyncReadToAsyncIterator<GValue>(
  read: AsyncRead<GValue>,
): AsyncGenerator<GValue> {
  const controller = new AbortController();

  try {
    while (true) {
      await read(controller.signal);
    }
  } catch (error: unknown) {
    if (!(error instanceof CompleteError)) {
      throw error;
    }
  } finally {
    controller.abort();
  }
}

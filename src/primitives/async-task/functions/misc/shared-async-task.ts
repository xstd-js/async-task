import {
  rejectPromiseWhenSignalIsAborted
} from '../../../../helpers/reject-promise-when-signal-is-aborted.js';
import { type AsyncTask } from '../../async-task.js';

export function sharedAsyncTask<GReturn>(task: AsyncTask<[], GReturn>): AsyncTask<[], GReturn> {
  let readPromise: Promise<GReturn> | undefined;
  let controller: AbortController | undefined;
  let readCount: number = 0;

  return async (signal?: AbortSignal): Promise<GReturn> => {
    signal?.throwIfAborted();
    readCount++;

    if (readCount === 1) {
      controller = new AbortController();
      readPromise = task(controller.signal);
    }

    try {
      return await rejectPromiseWhenSignalIsAborted(readPromise!, signal);
    } finally {
      readCount--;

      if (readCount === 0) {
        controller!.abort();
      }
    }
  };
}

import { noop } from '@xstd/noop';
import { type AsyncTask, type AsyncTaskArguments } from '../../async-task.js';

export function queuedAsyncTask<GArguments extends readonly any[], GReturn>(
  task: AsyncTask<GArguments, GReturn>,
): AsyncTask<GArguments, GReturn> {
  let queue: Promise<any> = Promise.resolve();
  return (...args: AsyncTaskArguments<GArguments>): Promise<GReturn> => {
    return (queue = queue.then((): Promise<GReturn> => {
      return task(...args);
    }));
  };
}

export function queuedAsyncTaskWithRecovery<GArguments extends readonly any[], GReturn>(
  task: AsyncTask<GArguments, GReturn>,
): AsyncTask<GArguments, GReturn> {
  let queue: Promise<any> = Promise.resolve();
  return (...args: AsyncTaskArguments<GArguments>): Promise<GReturn> => {
    return (queue = queue.catch(noop).then((): Promise<GReturn> => {
      return task(...args);
    }));
  };
}

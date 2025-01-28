import { runInAbortableContext } from '../../../../helpers/run-in-abortable-context.js';
import { type AsyncTask, type AsyncTaskArguments } from '../../async-task.js';
import { inspectAsyncTaskArguments } from '../helpers/inspect-async-task-arguments.js';

export type FirstAsyncTaskToResolveRejectOn =
  | 'first-errored' // rejects when the first `task` rejects
  | 'all-errored'; // rejects when the all the `task` rejects

export interface FirstAsyncTaskToResolveOptions {
  readonly rejectsOn?: FirstAsyncTaskToResolveRejectOn;
}

/**
 * Runs concurrently a list of `AsyncTask` until one fulfils.
 */
export function firstFulfilledAsyncTask<GArguments extends readonly any[], GReturn>(
  tasks: Iterable<AsyncTask<GArguments, GReturn>>,
  { rejectsOn = 'all-errored' }: FirstAsyncTaskToResolveOptions = {},
): AsyncTask<GArguments, GReturn> {
  return async (..._args: AsyncTaskArguments<GArguments>): Promise<GReturn> => {
    const [args, signal] = inspectAsyncTaskArguments<GArguments, GReturn>(_args);
    return runInAbortableContext<GReturn>(async (signal: AbortSignal): Promise<GReturn> => {
      const promises: readonly Promise<GReturn>[] = Array.from(
        tasks,
        (task: AsyncTask<GArguments, GReturn>): Promise<GReturn> => {
          return task(...args, signal);
        },
      );

      if (rejectsOn === 'first-errored') {
        return await Promise.race(promises);
      } else {
        return await Promise.any(promises);
      }
    }, signal);
  };
}

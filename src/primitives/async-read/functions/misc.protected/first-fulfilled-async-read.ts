import {
  type FirstAsyncTaskToResolveOptions,
  firstFulfilledAsyncTask,
} from '../../../async-task/functions/misc/first-fulfilled-async-task.js';
import { type AsyncRead } from '../../async-read.js';

export interface FirstAsyncReadToResolveOptions extends FirstAsyncTaskToResolveOptions {}

/**
 * @see firstFulfilledAsyncTask
 * @deprecated
 */
export function firstFulfilledAsyncRead<GValue>(
  readers: Iterable<AsyncRead<GValue>>,
  options?: FirstAsyncReadToResolveOptions,
): AsyncRead<GValue> {
  return firstFulfilledAsyncTask<[], GValue>(readers, options);
}

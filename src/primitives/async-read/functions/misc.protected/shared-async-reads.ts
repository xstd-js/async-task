import { sharedAsyncTask } from '../../../async-task/functions/misc/shared-async-task.js';
import { type AsyncRead } from '../../async-read.js';

/**
 * @see sharedAsyncTask
 * @deprecated
 */
export function sharedAsyncReads<GValue>(read: AsyncRead<GValue>): AsyncRead<GValue> {
  return sharedAsyncTask<GValue>(read);
}

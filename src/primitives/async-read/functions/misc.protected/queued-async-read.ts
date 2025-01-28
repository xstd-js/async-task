import {
  queuedAsyncTask,
  queuedAsyncTaskWithRecovery,
} from '../../../async-task/functions/misc/queued-async-task.js';
import { type AsyncRead } from '../../async-read.js';

/**
 * @see queuedAsyncTask
 * @deprecated
 */
export function queuedAsyncRead<GValue>(read: AsyncRead<GValue>): AsyncRead<GValue> {
  return queuedAsyncTask<[], GValue>(read);
}

/**
 * @see queuedAsyncTaskWithRecovery
 * @deprecated
 */
export function queuedAsyncReadWithRecovery<GValue>(read: AsyncRead<GValue>): AsyncRead<GValue> {
  return queuedAsyncTaskWithRecovery<[], GValue>(read);
}

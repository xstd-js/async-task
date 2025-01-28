import { type AsyncTask } from '../async-task/async-task.js';

export type AsyncWrite<GValue> = AsyncTask<[value: GValue], void>;

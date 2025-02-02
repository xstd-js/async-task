import { type AsyncTask } from '../async-task/async-task.js';

export type AsyncAction<GIn, GOut> = AsyncTask<[value: GIn], GOut>;

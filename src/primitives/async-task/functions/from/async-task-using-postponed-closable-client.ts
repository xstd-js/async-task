import { type AsyncTask, type AsyncTaskArguments } from '../../async-task.js';
import { inspectAsyncTaskArguments } from '../helpers/inspect-async-task-arguments.js';
import { queuedAsyncTaskWithRecovery } from '../misc/queued-async-task.js';

export interface AsyncTaskUsingPostponedClosableClientOptions<
  GClient,
  GArguments extends readonly any[],
  GReturn,
> {
  readonly open: OpenPostponedClosableClient<GClient>;
  readonly call: CallPostponedClosableClient<GClient, GArguments, GReturn>;
  readonly postponeClose?: number;
}

export type OpenPostponedClosableClient<GClient> = AsyncTask<
  [],
  OpenPostponedClosableClientResult<GClient>
>;

export interface OpenPostponedClosableClientResult<GClient> {
  readonly client: GClient;
  readonly close: ClosePostponedClosableClient;
}

export interface ClosePostponedClosableClient {
  (): Promise<void> | void;
}

export type CallPostponedClosableClient<
  GClient,
  GArguments extends readonly any[],
  GReturn,
> = AsyncTask<[client: GClient, ...args: GArguments], GReturn>;

/**
 * Returns an `AsyncTask`, where we "open" a client and dispose of it `postponeDispose` ms after the task ends.
 */
export function asyncTaskUsingPostponedClosableClient<
  GClient,
  GArguments extends readonly any[],
  GReturn,
>({
  open,
  call,
  postponeClose = 5_000,
}: AsyncTaskUsingPostponedClosableClientOptions<GClient, GArguments, GReturn>): AsyncTask<
  GArguments,
  GReturn
> {
  let closePromise: Promise<void> | undefined;
  let client: GClient | undefined;
  let close: ClosePostponedClosableClient | undefined;
  let closeTimer: any | undefined;

  return queuedAsyncTaskWithRecovery<GArguments, GReturn>(
    async (..._args: AsyncTaskArguments<GArguments>): Promise<GReturn> => {
      const [args, signal] = inspectAsyncTaskArguments<GArguments>(_args);
      signal?.throwIfAborted();

      if (closeTimer !== undefined) {
        clearTimeout(closeTimer);
      }

      if (closePromise !== undefined) {
        await closePromise;
      }

      if (client === undefined) {
        const result: OpenPostponedClosableClientResult<GClient> = await open(signal);
        client = result.client;
        close = result.close;
      }

      try {
        return await call(client, ...args, signal);
      } finally {
        if (postponeClose <= 0) {
          await close!();
          client = undefined;
          close = undefined;
        } else {
          closeTimer = setTimeout((): void => {
            closeTimer = undefined;
            closePromise = (Promise as any)
              .try(close!)
              .finally((): void => {
                client = undefined;
                close = undefined;
                closePromise = undefined;
              })
              .catch((error: unknown): void => {
                console.error(error);
              });
          }, postponeClose);
        }
      }
    },
  );
}

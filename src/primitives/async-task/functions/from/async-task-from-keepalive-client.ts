import { type AsyncTask, type AsyncTaskArguments } from '../../async-task.js';
import { inspectAsyncTaskArguments } from '../helpers/inspect-async-task-arguments.js';
import { queuedAsyncTaskWithRecovery } from '../misc/queued-async-task.js';

export interface AsyncTaskFromKeepaliveClientOptions<
  GClient extends AsyncDisposable,
  GArguments extends readonly any[],
  GReturn,
> {
  readonly open: OpenKeepaliveClient<GClient>;
  readonly call: CallKeepaliveClient<GClient, GArguments, GReturn>;
  readonly keepalive?: number;
}

export type OpenKeepaliveClient<GClient extends AsyncDisposable> = AsyncTask<[], GClient>;

export type CallKeepaliveClient<
  GClient extends AsyncDisposable,
  GArguments extends readonly any[],
  GReturn,
> = AsyncTask<[client: GClient, ...args: GArguments], GReturn>;

/**
 * Returns an `AsyncTask`, where we "open" a client and keep it alive `keepalive` ms after the task ends.
 */
export function asyncTaskFromKeepaliveClient<
  GClient extends AsyncDisposable,
  GArguments extends readonly any[],
  GReturn,
>({
  open,
  call,
  keepalive = 5_000,
}: AsyncTaskFromKeepaliveClientOptions<GClient, GArguments, GReturn>): AsyncTask<
  GArguments,
  GReturn
> {
  let closePromise: Promise<void> | undefined;
  let client: GClient | undefined;
  let closeTimer: any | undefined;

  return queuedAsyncTaskWithRecovery<GArguments, GReturn>(
    async (..._args: AsyncTaskArguments<GArguments>): Promise<GReturn> => {
      const [args, signal] = inspectAsyncTaskArguments<GArguments, GReturn>(_args);
      signal?.throwIfAborted();

      if (closeTimer !== undefined) {
        clearTimeout(closeTimer);
      }

      if (closePromise !== undefined) {
        await closePromise;
      }

      if (client === undefined) {
        client = await open(signal);
      }

      try {
        return await call(client, ...args, signal);
      } finally {
        if (keepalive <= 0) {
          await client![Symbol.asyncDispose]();
          client = undefined;
        } else {
          closeTimer = setTimeout((): void => {
            closeTimer = undefined;
            closePromise = (Promise as any).try(client![Symbol.asyncDispose])
              .finally((): void => {
                client = undefined;
                closePromise = undefined;
              })
              .catch((error: unknown): void => {
                console.error(error);
              });
          }, keepalive);
        }
      }
    },
  );
}

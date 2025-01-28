import { type AsyncRead } from '../../../async-read.js';
import { queuedAsyncRead } from '../../misc.protected/queued-async-read.js';
import { type AsyncReadFromEventTargetOptions } from './async-read-from-event-target-options.js';

export interface AsyncReadFromBufferedEventTargetOptions extends AsyncReadFromEventTargetOptions {
  readonly signal?: AbortSignal;
}

export function asyncReadFromBufferedEventTarget<GEvent extends Event>(
  target: EventTarget,
  eventName: string,
  {
    errorEventName = 'error',
    getError,
    signal: globalSignal,
  }: AsyncReadFromBufferedEventTargetOptions = {},
): AsyncRead<GEvent> {
  if (globalSignal?.aborted) {
    return (): Promise<GEvent> => {
      return Promise.reject(globalSignal.reason);
    };
  }

  interface QueuedEvent<GType extends string> {
    readonly type: GType;
  }

  interface QueuedEventEvent extends QueuedEvent<'event'> {
    readonly event: GEvent;
  }

  interface QueuedEventError extends QueuedEvent<'error'> {
    readonly error: unknown;
  }

  type UnknownQueuedEvent = QueuedEventEvent | QueuedEventError;

  const events: UnknownQueuedEvent[] = [];

  let pendingEvent: PromiseWithResolvers<void> | undefined;

  const cleanUp = (): void => {
    target.removeEventListener(eventName, onEvent);
    if (errorEventName !== null) {
      target.removeEventListener(errorEventName, onError);
    }
    globalSignal?.removeEventListener('abort', onAbort);
  };

  const onEvent = (event: Event): void => {
    events.push({
      type: 'event',
      event: event as GEvent,
    });
    pendingEvent?.resolve();
  };

  const onError = (event: Event): void => {
    cleanUp();
    events.push({
      type: 'error',
      error: getError?.(event),
    });
    pendingEvent?.resolve();
  };

  const onAbort = (): void => {
    cleanUp();
    pendingEvent?.reject(globalSignal!.reason);
  };

  target.addEventListener(eventName, onEvent);
  if (errorEventName !== null) {
    target.addEventListener(errorEventName, onError);
  }
  globalSignal?.addEventListener('abort', onAbort);

  return queuedAsyncRead<GEvent>(async (signal?: AbortSignal): Promise<GEvent> => {
    globalSignal?.throwIfAborted();
    signal?.throwIfAborted();

    while (true) {
      if (events.length > 0) {
        const event: UnknownQueuedEvent = events.shift()!;

        if (event.type === 'event') {
          return event.event;
        } else {
          throw event.error;
        }
      }

      pendingEvent = Promise.withResolvers<void>();

      const cleanUp = (): void => {
        signal?.removeEventListener('abort', onAbort);
        pendingEvent = undefined;
      };

      const onAbort = (): void => {
        cleanUp();
        pendingEvent!.reject(signal!.reason);
      };

      signal?.addEventListener('abort', onAbort);

      await pendingEvent.promise;
      cleanUp();
    }
  });
}

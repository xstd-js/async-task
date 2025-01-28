import { type AsyncRead } from '../../../async-read.js';
import { type AsyncReadFromEventTargetOptions } from './async-read-from-event-target-options.js';

export interface AsyncReadFromNextEventTargetOptions extends AsyncReadFromEventTargetOptions {}

// concurrent
export function asyncReadFromNextEventTarget<GEvent extends Event>(
  target: EventTarget,
  eventName: string,
  { errorEventName = 'error', getError }: AsyncReadFromNextEventTargetOptions = {},
): AsyncRead<GEvent> {
  return (signal?: AbortSignal): Promise<GEvent> => {
    return new Promise<GEvent>(
      (resolve: (value: GEvent) => void, reject: (reason?: any) => void): void => {
        signal?.throwIfAborted();

        const cleanUp = (): void => {
          target.removeEventListener(eventName, onEvent);
          if (errorEventName !== null) {
            target.removeEventListener(errorEventName, onError);
          }
          signal?.removeEventListener('abort', onAbort);
        };

        const onEvent = (event: Event): void => {
          cleanUp();
          resolve(event as GEvent);
        };

        const onError = (event: Event): void => {
          cleanUp();
          reject(getError?.(event));
        };

        const onAbort = (): void => {
          cleanUp();
          reject(signal!.reason);
        };

        target.addEventListener(eventName, onEvent);
        if (errorEventName !== null) {
          target.addEventListener(errorEventName, onError);
        }
        signal?.addEventListener('abort', onAbort);
      },
    );
  };
}

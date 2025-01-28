import { type InferEventMapOf } from '@xstd/infer-event-map-of';

/**
 * Returns a Promise resolved when the first Event is received from `target.addEventListener(type, ...)`.
 */
export function untilNextEvent<
  GTarget extends EventTarget,
  GType extends keyof InferEventMapOf<GTarget>,
>(target: GTarget, type: GType, signal?: AbortSignal): Promise<InferEventMapOf<GTarget>[GType]>;
export function untilNextEvent(
  target: EventTarget,
  type: string,
  signal?: AbortSignal,
): Promise<Event>;
export function untilNextEvent(
  target: EventTarget,
  type: string,
  signal?: AbortSignal,
): Promise<Event> {
  return new Promise<Event>(
    (resolve: (value: Event) => void, reject: (reason?: unknown) => void): void => {
      signal?.throwIfAborted();

      const end = (): void => {
        target.removeEventListener(type, onEvent);
        signal?.removeEventListener('abort', onAbort);
      };

      const onEvent = (event: Event): void => {
        end();
        resolve(event);
      };

      const onAbort = (): void => {
        end();
        reject(signal!.reason);
      };

      target.addEventListener(type, onEvent);
      signal?.addEventListener('abort', onAbort);
    },
  );
}

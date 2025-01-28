/**
 * Returns a Promise proxying `promise`, but rejected immediately as soon as `signal` is aborted.
 *
 * **NOTE**: the provided `promise`'s process continue to exists even when the `signal` is aborted,
 *   only, the returned promise rejects.
 *
 * @example
 *
 * The [permission API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions/query) does not support "abortion", thus, we may wrap it with `rejectPromiseWhenSignalIsAborted`:
 *
 * ```ts
 * const status: PermissionStatus = await rejectPromiseWhenSignalIsAborted(navigator.permissions.query({ name: 'geolocation' }), signal);
 * ```
 */
export function rejectPromiseWhenSignalIsAborted<GValue>(
  promise: Promise<GValue>,
  signal?: AbortSignal,
): Promise<GValue> {
  if (signal === undefined) {
    return promise;
  } else {
    return new Promise<GValue>(
      (resolve: (value: GValue) => void, reject: (reason?: unknown) => void): void => {
        signal.throwIfAborted();

        const end = (): void => {
          signal.removeEventListener('abort', onAbort);
        };

        const _resolve = (value: GValue): void => {
          end();
          resolve(value);
        };

        const _reject = (reason?: unknown): void => {
          end();
          reject(reason);
        };

        const onAbort = (): void => {
          end();
          _reject(signal.reason);
        };

        signal.addEventListener('abort', onAbort);

        promise.then(_resolve, _reject);
      },
    );
  }
}

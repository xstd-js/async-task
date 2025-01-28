import { WebSocketError } from '@xstd/custom-error';

export function untilWebSocketOpened(webSocket: WebSocket, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve: () => void, reject: (reason: unknown) => void): void => {
    signal?.throwIfAborted();

    switch (webSocket.readyState) {
      case webSocket.CONNECTING: {
        const cleanUp = (): void => {
          webSocket.removeEventListener('open', onOpen);
          webSocket.removeEventListener('error', onError);
          webSocket.removeEventListener('close', onClose);
          signal?.removeEventListener('abort', onAbort);
        };

        const onOpen = (): void => {
          cleanUp();
          resolve();
        };

        const onError = (): void => {
          cleanUp();
          reject(new WebSocketError());
        };

        const onClose = (event: CloseEvent): void => {
          cleanUp();
          reject(WebSocketError.fromCloseEvent(event));
        };

        const onAbort = (): void => {
          cleanUp();
          reject(signal!.reason);
        };

        webSocket.addEventListener('open', onOpen);
        webSocket.addEventListener('error', onError);
        webSocket.addEventListener('close', onClose);
        signal?.addEventListener('abort', onAbort);

        break;
      }
      case webSocket.OPEN:
        return resolve();
      case webSocket.CLOSING:
        return reject(new Error('WebSocket closing.'));
      case webSocket.CLOSED:
        return reject(new Error('WebSocket closed.'));
    }
  });
}

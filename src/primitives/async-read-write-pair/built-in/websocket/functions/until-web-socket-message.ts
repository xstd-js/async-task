import { WebSocketError } from '@xstd/custom-error';

export function untilWebSocketMessage(
  webSocket: WebSocket,
  signal?: AbortSignal,
): Promise<MessageEvent> {
  return new Promise<MessageEvent>(
    (resolve: (value: MessageEvent) => void, reject: (reason?: any) => void): void => {
      signal?.throwIfAborted();

      switch (webSocket.readyState) {
        case webSocket.CONNECTING:
        case webSocket.OPEN: {
          const cleanUp = (): void => {
            webSocket.removeEventListener('message', onMessage);
            webSocket.removeEventListener('error', onError);
            webSocket.removeEventListener('close', onClose);
            signal?.removeEventListener('abort', onAbort);
          };

          const onMessage = (event: MessageEvent): void => {
            cleanUp();
            resolve(event);
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

          webSocket.addEventListener('message', onMessage);
          webSocket.addEventListener('error', onError);
          webSocket.addEventListener('close', onClose);
          signal?.addEventListener('abort', onAbort);

          break;
        }
        case webSocket.CLOSING:
          return reject(new Error('WebSocket closing.'));
        case webSocket.CLOSED:
          return reject(new Error('WebSocket closed.'));
      }
    },
  );
}

import { WebSocketError } from '@xstd/custom-error';
import { type AsyncReadWritePair } from '../../async-read-write-pair.js';
import { untilWebSocketFlushed } from './functions/until-web-socket-flushed.js';
import { untilWebSocketMessage } from './functions/until-web-socket-message.js';
import { untilWebSocketOpened } from './functions/until-web-socket-opened.js';
import { type WebSocketReadValue } from './types/web-socket-read-value.js';
import { type WebSocketWriteValue } from './types/web-socket-write-value.js';

export interface CreateWebSocketAsyncPairOptions {
  readonly protocols?: string | readonly string[];
  readonly keepalive?: number;
  readonly close?: (reason: unknown) => void;
}

export function createWebSocketAsyncPair(
  url: string | URL,
  { protocols, keepalive = 5_000, close }: CreateWebSocketAsyncPairOptions = {},
): AsyncReadWritePair<WebSocketReadValue, WebSocketWriteValue> {
  let webSocket: WebSocket | undefined;
  let consumersCount: number = 0;
  let closeWebSocketTimer: any | undefined;

  const openWebSocket = (): WebSocket => {
    consumersCount++;
    clearScheduledCloseWebsocket();
    if (webSocket === undefined) {
      webSocket = new WebSocket(url, protocols as string[]);
      webSocket.binaryType = 'arraybuffer';
    }
    return webSocket!;
  };

  const closeWebSocket = (reason?: unknown): void => {
    consumersCount--;
    if (consumersCount === 0) {
      console.assert(webSocket !== undefined);

      if (
        webSocket!.readyState === WebSocket.CONNECTING ||
        webSocket!.readyState === WebSocket.OPEN
      ) {
        scheduleCloseWebsocket(reason);
      } else {
        clearScheduledCloseWebsocket();
        webSocket = undefined;
        close?.(reason);
      }
    }
  };

  const clearScheduledCloseWebsocket = (): void => {
    if (closeWebSocketTimer !== undefined) {
      clearTimeout(closeWebSocketTimer);
      closeWebSocketTimer = undefined;
    }
  };

  const scheduleCloseWebsocket = (reason: unknown): void => {
    clearScheduledCloseWebsocket();

    const scheduledClose = (): void => {
      console.assert(webSocket !== undefined);

      if (
        webSocket!.readyState === WebSocket.CONNECTING ||
        webSocket!.readyState === WebSocket.OPEN
      ) {
        if (reason instanceof WebSocketError) {
          webSocket!.close(reason.code, reason.reason);
        } else {
          webSocket!.close();
        }
      }

      webSocket = undefined;
      close?.(reason);
    };

    if (keepalive <= 0) {
      scheduledClose();
    } else {
      closeWebSocketTimer = setTimeout((): void => {
        closeWebSocketTimer = undefined;
        scheduledClose();
      }, keepalive);
    }
  };

  return {
    read: (signal?: AbortSignal): Promise<WebSocketReadValue> => {
      if (signal?.aborted) {
        return Promise.reject(signal.reason);
      }

      const webSocket: WebSocket = openWebSocket();

      return untilWebSocketMessage(webSocket, signal).then(
        (messageEvent: MessageEvent): WebSocketReadValue => {
          closeWebSocket();
          return messageEvent.data;
        },
        (error: unknown): never => {
          closeWebSocket(error);
          throw error;
        },
      );
    },
    write: (value: WebSocketWriteValue, signal?: AbortSignal): Promise<void> => {
      if (signal?.aborted) {
        return Promise.reject(signal.reason);
      }

      const webSocket: WebSocket = openWebSocket();

      return untilWebSocketOpened(webSocket, signal)
        .then((): Promise<void> => {
          webSocket.send(value);
          return untilWebSocketFlushed(webSocket, signal);
        })
        .then(closeWebSocket, (error: unknown): never => {
          closeWebSocket(error);
          throw error;
        });
    },
  };
}

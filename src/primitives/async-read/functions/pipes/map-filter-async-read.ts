import { DISCARD_TOKEN, type DiscardToken, type MapFilterFunction } from '@xstd/functional';
import { type AsyncRead } from '../../async-read.js';

export function mapFilterAsyncRead<GIn, GOut>(
  read: AsyncRead<GIn>,
  mapFnc: MapFilterFunction<GIn, GOut>,
): AsyncRead<GOut> {
  return async (signal?: AbortSignal): Promise<GOut> => {
    while (true) {
      const newValue: GOut | DiscardToken = mapFnc(await read(signal));
      if (newValue !== DISCARD_TOKEN) {
        return newValue;
      }
    }
  };
}

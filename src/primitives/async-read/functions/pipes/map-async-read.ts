import { type MapFunction } from '@xstd/functional';
import { type AsyncRead } from '../../async-read.js';

export function mapAsyncRead<GIn, GOut>(
  read: AsyncRead<GIn>,
  mapFnc: MapFunction<GIn, GOut>,
): AsyncRead<GOut> {
  return async (signal?: AbortSignal): Promise<GOut> => {
    return mapFnc(await read(signal));
  };
}

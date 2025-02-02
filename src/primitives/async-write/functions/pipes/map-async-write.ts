import { type MapFunction } from '@xstd/functional';
import { type AsyncWrite } from '../../async-write.js';


export function mapAsyncWrite<GIn, GOut>(
  write: AsyncWrite<GOut>,
  mapFnc: MapFunction<GIn, GOut>,
): AsyncWrite<GIn> {
  return (value: GIn, signal?: AbortSignal): Promise<void> => {
    return write(mapFnc(value), signal);
  };
}

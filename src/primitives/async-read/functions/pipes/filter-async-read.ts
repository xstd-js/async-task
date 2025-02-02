import { type FilterFunction, type FilterFunctionWithSubType } from '@xstd/functional';
import { type AsyncRead } from '../../async-read.js';

export function filterAsyncRead<GIn, GOut extends GIn>(
  read: AsyncRead<GIn>,
  filterFnc: FilterFunctionWithSubType<GIn, GOut>,
): AsyncRead<GOut>;
export function filterAsyncRead<GValue>(
  read: AsyncRead<GValue>,
  filterFnc: FilterFunction<GValue>,
): AsyncRead<GValue>;
export function filterAsyncRead<GValue>(
  read: AsyncRead<GValue>,
  filterFnc: FilterFunction<GValue>,
): AsyncRead<GValue> {
  return async (signal?: AbortSignal): Promise<GValue> => {
    let value: GValue;
    while (!filterFnc((value = await read(signal))));
    return value;
  };
}

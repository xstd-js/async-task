import { type AsyncTaskArguments } from '../../async-task.js';

export function inspectAsyncTaskArguments<GArguments extends readonly any[], GReturn>(
  args: AsyncTaskArguments<GArguments>,
): [args: GArguments, signal: AbortSignal | undefined] {
  return (
    args.length > 0 && args[args.length - 1] instanceof AbortSignal ?
      [args.slice(0, -1), args[args.length - 1]]
    : [args, undefined]) as any;
}

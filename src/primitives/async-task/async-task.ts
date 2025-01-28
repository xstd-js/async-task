export interface AsyncTask<GArguments extends readonly any[], GReturn> {
  (...args: AsyncTaskArguments<GArguments>): Promise<GReturn>;
}

export type AsyncTaskArguments<GArguments extends readonly any[]> = readonly [
  ...args: GArguments,
  signal?: AbortSignal,
];

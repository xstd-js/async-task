export type OptionalAbortSignal = AbortSignal | undefined;

export function anyOfAbortSignals(signals: readonly OptionalAbortSignal[]): AbortSignal {
  return AbortSignal.any(
    signals.filter((signal: OptionalAbortSignal): signal is AbortSignal => {
      return signal !== undefined;
    }),
  );
}

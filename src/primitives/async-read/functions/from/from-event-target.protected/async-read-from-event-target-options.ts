export interface AsyncReadFromEventTargetOptions {
  readonly errorEventName?: string | null;
  readonly getError?: (event: Event) => void;
}

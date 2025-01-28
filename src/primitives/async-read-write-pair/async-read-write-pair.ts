import { type AsyncRead } from '../async-read/async-read.js';
import { type AsyncWrite } from '../async-write/async-write.js';

export interface AsyncReadWritePair<GRead, GWrite> {
  readonly read: AsyncRead<GRead>;
  readonly write: AsyncWrite<GWrite>;
}

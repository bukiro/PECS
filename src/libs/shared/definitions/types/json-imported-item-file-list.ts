import { DeepPartial } from './deep-partial';

export type ImportedJsonFileList<T> = Record<string, Array<DeepPartial<T>>>;

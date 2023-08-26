import { DeepPartial } from './deepPartial';

export type ImportedJsonFileList<T> = Record<string, Array<DeepPartial<T>>>;

import { Serialized } from '../interfaces/serializable';

export type ImportedJsonFileList<T> = Record<string, Array<Serialized<T>>>;

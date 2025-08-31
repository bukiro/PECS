import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';

export type ImportedJsonFileList<T> = Record<string, Array<Serialized<T>>>;

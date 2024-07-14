import { DeepPartial } from '../types/deep-partial';
import { RecastFns } from './recast-fns';

export interface Serializable<T> {
    with: ((values: Partial<T>, recastFns?: RecastFns) => T) | ((values: Partial<T>, recastFns: RecastFns) => T);
    forExport: () => DeepPartial<T>;
    clone: (() => T) | ((recastFns: RecastFns) => T);
    isEqual: (compared: Partial<T>, options?: { withoutId?: boolean }) => boolean;
}

export interface MessageSerializable<T> extends Serializable<T> {
    forMessage: () => DeepPartial<T>;
}

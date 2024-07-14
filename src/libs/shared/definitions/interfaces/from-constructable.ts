import { DeepPartial } from '../types/deep-partial';
import { RecastFns } from './recast-fns';

export interface FromConstructable<T> {
    from: ((values: DeepPartial<T>, recastFns: RecastFns) => T) | ((values: DeepPartial<T>) => T);
}

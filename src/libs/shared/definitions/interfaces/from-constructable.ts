import { DeepPartial } from '../types/deepPartial';
import { RecastFns } from './recastFns';

export interface FromCastable<T> {
    from: ((values: DeepPartial<T>, recastFns: RecastFns) => T) | ((values: DeepPartial<T>) => T);
}

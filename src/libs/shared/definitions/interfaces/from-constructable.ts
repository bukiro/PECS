import { DeepPartial } from '../types/deepPartial';
import { RecastFns } from './recastFns';

export interface FromConstructable<T> {
    from: ((values: DeepPartial<T>, recastFns: RecastFns) => T) | ((values: DeepPartial<T>) => T);
}

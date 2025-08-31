import { RecastFns } from './recast-fns';
import { MaybeSerialized } from './serializable';

export interface FromConstructable<T> {
    from: ((values: MaybeSerialized<T>, recastFns: RecastFns) => T) | ((values: MaybeSerialized<T>) => T);
}

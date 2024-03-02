import { RecastFns } from './recastFns';


export interface Recastable<T> {
    recast: (...args: Array<RecastFns>) => T;
}

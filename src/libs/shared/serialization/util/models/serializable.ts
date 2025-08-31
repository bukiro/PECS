import { RecastFns } from './recast-fns';
import { ResolveSignal } from '../../../common/util/utils/signal-utils';

type ArrayOrMaybeSerialized<T> = T extends Array<infer M> ? Array<MaybeSerialized<M>> : MaybeSerialized<T>;
type ArrayOrSerialized<T> = T extends Array<infer M> ? Array<Serialized<M>> : Serialized<T>;

// TODO: Check if the readonly still needs to be removed.
// If so, add an explanation.
export type MaybeSerialized<T> = Partial<{
    -readonly [K in keyof T]: ArrayOrMaybeSerialized<ResolveSignal<T[K]>> | ArrayOrMaybeSerialized<T[K]> | T[K]
}>;

export type Serialized<T> = Partial<{
    -readonly [K in keyof T]: ArrayOrSerialized<ResolveSignal<T[K]>>
}>;

export interface Serializable<T> {
    with: ((values: MaybeSerialized<T>, recastFns?: RecastFns) => T)
    | ((values: MaybeSerialized<T>, recastFns: RecastFns) => T);
    forExport: () => Serialized<T>;
    clone: (() => T) | ((recastFns: RecastFns) => T);
    isEqual: (compared: Partial<T>, options?: { withoutId?: boolean }) => boolean;
}

export interface MessageSerializable<T> extends Serializable<T> {
    forMessage: () => Serialized<T>;
}

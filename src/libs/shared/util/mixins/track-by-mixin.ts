import { Constructable } from '../../definitions/interfaces/constructable';
import { BaseClass } from '../classes/base-class';

interface TrackBy {
    trackByIndex: (index: number) => number;
    trackByObjectId: (_index: number, object: { id: string }) => string;
}

// TODO: Remove!
export function TrackByMixin<T extends Constructable<BaseClass>>(base: T): Constructable<TrackBy> & T {
    return class extends base {
        public trackByIndex(index: number): number { return index; }

        public trackByObjectId(_index: number, object: { id: string }): string { return object.id; }
    };
}

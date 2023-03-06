import { Subject } from 'rxjs';
import { Constructable } from '../../definitions/interfaces/constructable';
import { BaseClass } from './base-class';

interface Destroyable {
    destroyed$: Subject<undefined>;
}

export function DestroyableMixin<T extends Constructable<BaseClass>>(base: T): Constructable<Destroyable> & T {
    return class extends base {
        public destroyed$ = new Subject<undefined>();
    };
}

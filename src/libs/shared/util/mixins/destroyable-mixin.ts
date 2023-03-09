import { Subject } from 'rxjs';
import { Constructable } from '../../definitions/interfaces/constructable';
import { BaseClass } from './base-class';

interface Destroyable {
    destroyed$: Subject<true>;
    destroy: () => void;
}

export function DestroyableMixin<T extends Constructable<BaseClass>>(base: T): Constructable<Destroyable> & T {
    return class extends base {
        public readonly destroyed$ = new Subject<true>();

        public destroy(): void {
            this.destroyed$.next(true);
            this.destroyed$.complete();
        }
    };
}

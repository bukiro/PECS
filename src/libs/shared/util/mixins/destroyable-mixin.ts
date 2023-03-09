import { Subject } from 'rxjs';
import { Constructable } from '../../definitions/interfaces/constructable';
import { BaseClass } from './base-class';

interface Destroyable {
    destroyed$: Subject<true>;
    destroy: () => void;
}

/**
 * Adds a public `destroyed$` subject that can be triggered to end subscriptions.
 *
 * ## Example
 *
 * ```ts
 * this.update$
 *     .pipe(
 *         takeUntil(this.destroyed$)
 *     )
 *     .subscribe();
 *
 * ...
 *
 * this.destroy();
 * ```
 *
 * If minimizing is desired as well, consider extending BaseCardComponent instead.
 */
export function DestroyableMixin<T extends Constructable<BaseClass>>(base: T): Constructable<Destroyable> & T {
    return class extends base {
        public readonly destroyed$ = new Subject<true>();

        public destroy(): void {
            this.destroyed$.next(true);
            this.destroyed$.complete();
        }
    };
}

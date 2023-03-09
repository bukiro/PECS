import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * A component that has all the variables to
 * - toggle being minimized with a toggle function (toggle function not included)
 * - force being minimized with the forceMinimized attribute
 * - send a destroyed emission to end subscriptions
 *
 * To toggle being minimized, it is recommended to use an Observable that sets
 * `this._isMinimizedBySetting` and then calls `this._updateMinimized()`.
 * A toggle function should cause the Observable to emit the new value.
 */
@Component({
    selector: 'app-base-card-element',
    template: '',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCardComponent {

    /**
     * This should not be touched other than by `this.updateMinimized()`.
     */
    @HostBinding('class.minimized')
    private _isMinimized = false;

    /**
     * This can be read asynchronously in the template to reactively update dependent elements.
     */
    public readonly isMinimized$ = new BehaviorSubject<boolean>(false);

    /**
     * Observable pipes can use `takeUntil(this._destroyed$)` to unsubscribe when it emits.
     */
    protected readonly _destroyed$ = new Subject<true>();

    /**
     * This should not be touched other than by `this._updateMinimized()`;
     */
    private _isMinimizedBySetting = false;

    /**
     * This should not be touched other than by `this.forceMinimized()`.
     */
    private _isForcedMinimized = false;

    public get forceMinimized(): boolean | undefined {
        return this._isForcedMinimized;
    }

    /**
     * This should be called depending on the settings.
     *
     * ## Example
     *
     * Update HostBinding when timeMinimized changes in the settings.
     *
     * ```ts
     *
     * SettingsService.settings$
     *     .pipe(
     *         map(settings => settings.timeMinimized),
     *         distinctUntilChanged(),
     *     )
     *     .subscribe(minimized => {
     *         this._updateMinimized({ bySetting: minimized });
     *     });
     * ```
     */
    protected _updateMinimized(minimized: { forced?: boolean; bySetting?: boolean } = {}): void {
        if (minimized.bySetting !== undefined) {
            this._isMinimizedBySetting = minimized.bySetting;
        }

        if (minimized.forced !== undefined) {
            this._isForcedMinimized = minimized.forced;
        }

        this._isMinimized = this._isMinimizedBySetting || this._isForcedMinimized;
        this.isMinimized$.next(this._isMinimized);
    }

    protected _destroy(): void {
        this._destroyed$.next(true);
        this._destroyed$.complete();
    }

}

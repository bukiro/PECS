import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BaseCreatureElementComponent } from '../creature-component/base-creature-element.component';

/**
 * A component that has all the variables to
 * - toggle being minimized with a toggle function (toggle function not included)
 * - force being minimized with the forceMinimized attribute
 * - send a destroyed emission to end subscriptions
 * - update pipes with a new input creature
 *
 * To toggle being minimized, it is recommended to use an Observable that sets
 * `this._isMinimizedBySetting` and then calls `this._updateMinimized()`.
 * A toggle function should cause the Observable to emit the new value.
 */
@Component({
    selector: 'app-base-card',
    template: '',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseCardComponent extends BaseCreatureElementComponent {

    /**
     * This should not be touched other than by `this.updateMinimized()`.
     */
    @HostBinding('class.minimized')
    private _isMinimized = false;

    /**
     * This can be read asynchronously in the template to reactively update dependent elements.
     * It should be initialized in the component and listen to the appropriate settings value and/or other factors.
     *
     * this._updateMinimized() should be called in a tap or in a subscribe on this.
     */
    public isMinimized$?: Observable<boolean>;

    /**
     * This should be called depending on the settings.
     *
     * ## Example
     *
     * Update HostBinding when timeMinimized changes in the settings.
     *
     * ```ts
     *
     * combineLatest(
     *     SettingsService.settings$
     *         .pipe(
     *             switchMap(settings => settings.timeMinimized$),
     *         ),
     *     this.isForcedMinimized$
     *     .subscribe(minimized => {
     *         this._updateMinimized({ bySetting: minimized });
     *     });
     * ```
     */
    protected _updateMinimized(minimized: boolean): void {
        this._isMinimized = minimized;
    }

}

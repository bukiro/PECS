import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { delay, distinctUntilChanged, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { Store } from '@ngrx/store';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { propMap$ } from 'src/libs/shared/util/observableUtils';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalCompanionComponent extends IsMobileMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public show = false;

    public readonly character = CreatureService.character;

    public hover = '';
    public readonly creatureTypes = CreatureTypes;

    public readonly animalCompanion$ = CreatureService.companion$;
    public readonly isMinimized$: Observable<boolean>;
    public readonly isMenuOpen$: Observable<boolean>;

    private _showMode = '';
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _store$: Store,
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
    ) {
        super();

        this.isMinimized$ =
            propMap$(SettingsService.settings$, 'companionMinimized$');

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menuState => menuState === MenuNames.CompanionMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            delay(Defaults.closingMenuClearDelay),
                        ),
                ),
            );
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.setSetting(settings => { settings.companionMinimized = minimized; });
    }

    public toggleCompanionMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.CompanionMenu }));
    }

    public toggleShowMode(type: string): void {
        this._showMode = this._showMode === type ? '' : type;
    }

    public showMode(): string {
        return this._showMode;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .pipe(
                takeUntilDestroyed(),
            )
            .subscribe(target => {
                if (['companion', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .pipe(
                takeUntilDestroyed(),
            )
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'companion' && ['companion', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}

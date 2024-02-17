import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { distinctUntilChanged, map, Observable, Subscription, switchMap, combineLatest, tap, of, debounceTime } from 'rxjs';
import { Familiar } from 'src/app/classes/Familiar';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCardComponent } from 'src/libs/shared/util/components/base-card/base-card.component';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { Store } from '@ngrx/store';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-familiar',
    templateUrl: './familiar.component.html',
    styleUrls: ['./familiar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliarComponent extends IsMobileMixin(BaseCardComponent) implements OnInit, OnDestroy {

    public readonly character = CreatureService.character;

    public readonly isMenuOpen$: Observable<boolean>;
    public readonly familiar$: Observable<Familiar>;

    private _showMode = '';
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _store$: Store,
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) {
        super();

        this.familiar$ = CreatureService.familiar$;

        this.isMinimized$ =
            SettingsService.settings$
                .pipe(
                    switchMap(settings => settings.familiarMinimized$),
                    tap(minimized => this._updateMinimized(minimized)),
                );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menu => menu === MenuNames.FamiliarMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            debounceTime(Defaults.closingMenuClearDelay),
                        ),
                ),
            );
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.setSetting(settings => { settings.familiarMinimized = minimized; });
    }

    public toggleFamiliarMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.FamiliarMenu }));
    }

    public toggleShownMode(type: string): void {
        this._showMode = this._showMode === type ? '' : type;
    }

    public shownMode(): string {
        return this._showMode;
    }

    public areFamiliarAbilitiesFinished$(): Observable<boolean> {
        return combineLatest([
            this.familiar$,
            this._creatureEffectsService.absoluteEffectsOnThis$(this.character, 'Familiar Abilities'),
            this._creatureEffectsService.relativeEffectsOnThis$(this.character, 'Familiar Abilities'),
        ])
            .pipe(
                map(([familiar, absolutes, relatives]) => {
                    const choice = familiar.abilities;
                    let available = choice.available;

                    absolutes.forEach(effect => {
                        available = effect.setValueNumerical;
                    });
                    relatives.forEach(effect => {
                        available += effect.valueNumerical;
                    });

                    return choice.feats.length >= available;
                }),
            );

    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .pipe(
                takeUntilDestroyed(),
            )
            .subscribe(target => {
                if (['familiar', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .pipe(
                takeUntilDestroyed(),
            )
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'familiar' && ['familiar', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}

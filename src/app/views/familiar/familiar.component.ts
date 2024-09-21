import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, switchMap, map, distinctUntilChanged, of, delay, combineLatest } from 'rxjs';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { ActivitiesComponent } from 'src/libs/activities/components/activities/activities.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { InventoryComponent } from 'src/libs/inventory/components/inventory/inventory.component';
import { DefenseComponent } from 'src/libs/defense/components/defense/defense.component';
import { SkillsComponent } from 'src/libs/skills/components/skills/skills.component';
import { HealthComponent } from 'src/libs/health/components/health/health.component';
import { FamiliarabilitiesComponent } from './components/familiar-abilities/familiar-abilities.component';
import { GeneralComponent } from 'src/libs/general/components/general/general.component';
import { EffectsComponent } from 'src/libs/effects/components/effects/effects.component';
import { CommonModule } from '@angular/common';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';

@Component({
    selector: 'app-familiar',
    templateUrl: './familiar.component.html',
    styleUrls: ['./familiar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        FlyInMenuComponent,
        EffectsComponent,
        GeneralComponent,
        FamiliarabilitiesComponent,
        HealthComponent,
        SkillsComponent,
        DefenseComponent,
        InventoryComponent,
        ActionIconsComponent,
        ActivitiesComponent,
    ],
})
export class FamiliarComponent extends IsMobileMixin(BaseCreatureElementComponent) {

    @Input()
    public show = false;

    public readonly character = CreatureService.character;

    public readonly isMinimized$: Observable<boolean>;
    public readonly isMenuOpen$: Observable<boolean>;
    public readonly familiar$: Observable<Familiar>;

    private _showMode = '';

    constructor(
        private readonly _store$: Store,
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) {
        super();

        this.familiar$ = CreatureService.familiar$;

        this.isMinimized$ =
            SettingsService.settings$
                .pipe(
                    switchMap(settings => settings.familiarMinimized$),
                );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menu => menu === MenuNames.FamiliarMenu),
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

}

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, switchMap, distinctUntilChanged, combineLatest } from 'rxjs';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { AbilityLiveValue, AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent extends TrackByMixin(BaseCreatureElementComponent) {

    public isMinimized$: Observable<boolean>;
    public readonly abilityValues$: Observable<Array<AbilityLiveValue>>;

    constructor(
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _abilityValuesService: AbilityValuesService,
    ) {
        super();

        this.isMinimized$ = this.creature$
            .pipe(
                switchMap(creature => SettingsService.settings$
                    .pipe(
                        switchMap(settings => {
                            switch (creature.type) {
                                case CreatureTypes.AnimalCompanion:
                                    return settings.companionMinimized$;
                                default:
                                    return settings.abilitiesMinimized$;
                            }
                        }),
                    ),
                ),
                distinctUntilChanged(),
            );

        this.abilityValues$ = this.creature$
            .pipe(
                switchMap(creature => combineLatest(
                    this._abilitiesDataService.abilities()
                        .map(ability => this._abilityValuesService.liveValue$(ability, creature)),
                )),
            );
    }

    public get creature(): Character | AnimalCompanion {
        if (super.creature.isCharacter() || super.creature.isAnimalCompanion()) {
            return super.creature;
        }

        return CreatureService.character;
    }

    @Input()
    public set creature(creature: Character | AnimalCompanion) {
        this._updateCreature(creature);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.creature.isCharacter();
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.setSetting(settings => settings.abilitiesMinimized = minimized);
    }
}

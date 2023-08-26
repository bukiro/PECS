import { Component, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { combineLatest, distinctUntilChanged, Observable, shareReplay, switchMap, takeUntil, tap } from 'rxjs';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService, AbilityLiveValue } from 'src/libs/shared/services/ability-values/ability-values.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCardComponent } from 'src/libs/shared/util/components/base-card/base-card.component';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent extends TrackByMixin(BaseCardComponent) implements OnDestroy {

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
                tap(minimized => this._updateMinimized(minimized)),
                // If the button is hidden, another subscription ensures that the pipe is run.
                // shareReplay prevents it from running twice if the button is not hidden.
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        // Subscribe to the minimized pipe in case the button is hidden and not subscribing.
        this.isMinimized$
            .pipe(
                takeUntil(this._destroyed$),
            )
            .subscribe();

        this.abilityValues$ = this.creature$
            .pipe(
                switchMap(creature => combineLatest(
                    this._abilitiesDataService.abilities()
                        .map(ability => this._abilityValuesService.liveValue$(ability, creature)),
                )),
            );
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

    public ngOnDestroy(): void {
        this._destroy();
    }

}

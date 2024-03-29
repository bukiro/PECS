import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Ability } from 'src/app/classes/Ability';
import { Creature } from 'src/app/classes/Creature';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService, CalculatedAbility } from 'src/libs/shared/services/ability-values/ability-values.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { StatusService } from 'src/app/core/services/status/status.service';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes.Character | CreatureTypes.AnimalCompanion = CreatureTypes.Character;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _ablityValuesService: AbilityValuesService,
        private readonly _refreshService: RefreshService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        return this.creature === CreatureTypes.AnimalCompanion
            ? CreatureService.character.settings.companionMinimized
            : CreatureService.character.settings.abilitiesMinimized;
    }

    public get stillLoading(): boolean {
        return this._abilitiesDataService.stillLoading || StatusService.isLoadingCharacter;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public minimize(): void {
        CreatureService.character.settings.abilitiesMinimized = !CreatureService.character.settings.abilitiesMinimized;
    }

    public abilities(subset = 0): Array<Ability> {
        const all = 0;
        const firstThree = 1;
        const lastThree = 2;
        const thirdAbility = 2;

        switch (subset) {
            case all:
                return this._abilitiesDataService.abilities();
            case firstThree:
                return this._abilitiesDataService.abilities().filter((_ability, index) => index <= thirdAbility);
            case lastThree:
                return this._abilitiesDataService.abilities().filter((_ability, index) => index > thirdAbility);
            default:
                return this._abilitiesDataService.abilities();
        }
    }

    public calculateAbility(ability: Ability): CalculatedAbility {
        return this._ablityValuesService.calculate(ability, this._currentCreature);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['abilities', 'all', this.creature.toLowerCase()].includes(target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['abilities', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}

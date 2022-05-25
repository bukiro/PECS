import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Ability } from 'src/app/classes/Ability';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes.Character | CreatureTypes.AnimalCompanion = CreatureTypes.Character;
    @Input()
    public sheetSide = 'left';

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        public abilitiesService: AbilitiesDataService,
        public characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        public effectsService: EffectsService,
    ) { }

    public minimize(): void {
        this.characterService.character().settings.abilitiesMinimized = !this.characterService.character().settings.abilitiesMinimized;
    }

    public isMinimized(): boolean {
        return this.creature === CreatureTypes.AnimalCompanion
            ? this.characterService.character().settings.companionMinimized
            : this.characterService.character().settings.abilitiesMinimized;
    }

    public trackByIndex(index: number): number {
        return index;
    }

    public character(): Character {
        return this.characterService.character();
    }

    public currentCreature(): Creature {
        return this.characterService.creatureFromType(this.creature);
    }

    public abilities(subset = 0): Array<Ability> {
        const all = 0;
        const firstThree = 1;
        const lastThree = 2;
        const thirdAbility = 2;

        switch (subset) {
            case all:
                return this.abilitiesService.abilities();
            case firstThree:
                return this.abilitiesService.abilities().filter((_ability, index) => index <= thirdAbility);
            case lastThree:
                return this.abilitiesService.abilities().filter((_ability, index) => index > thirdAbility);
            default:
                return this.abilitiesService.abilities();
        }

    }

    public stillLoading(): boolean {
        return this.abilitiesService.stillLoading || this.characterService.stillLoading;
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

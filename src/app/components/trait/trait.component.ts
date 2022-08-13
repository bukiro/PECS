import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Trait } from 'src/app/classes/Trait';
import { Item, TraitActivation } from 'src/app/classes/Item';
import { Trackers } from 'src/libs/shared/util/trackers';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature } from 'src/app/classes/Creature';

@Component({
    selector: 'app-trait',
    templateUrl: './trait.component.html',
    styleUrls: ['./trait.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraitComponent {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public trait: Trait;
    @Input()
    public name: string;
    @Input()
    public item: Item = null;
    @Input()
    public extraDescription: string;

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        public trackers: Trackers,
    ) { }

    public currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    public onActivateEffect(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public objectTraitActivations(): Array<TraitActivation> {
        if (this.item) {
            this.item.prepareTraitActivations();

            return this.item.traitActivations.filter(activation =>
                activation.trait === this.trait.name ||
                (
                    this.trait.dynamic &&
                    activation.trait.includes(this.trait.name)
                ),
            );
        }

        return [];
    }

}

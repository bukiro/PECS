import { Component, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Trait } from 'src/app/classes/Trait';
import { Item } from 'src/app/classes/Item';

@Component({
    selector: 'app-trait',
    templateUrl: './trait.component.html',
    styleUrls: ['./trait.component.css'],
})
export class TraitComponent {

    @Input()
    creature = 'Character';
    @Input()
    trait: Trait;
    @Input()
    name: string;
    @Input()
    item: Item = null;
    @Input()
    extraDescription: string;

    constructor(
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Creature() {
        return this.characterService.creatureFromType(this.creature);
    }

    on_ActivateEffect() {
        this.refreshService.prepareDetailToChange(this.creature, 'effects');
        this.refreshService.processPreparedChanges();
    }

    get_ObjectTraitActivations() {
        if (this.item) {
            this.item.prepareTraitActivations();

            return this.item.traitActivations.filter(activation => activation.trait == this.trait.name || (this.trait.dynamic && activation.trait.includes(this.trait.name)));
        }

        return [];
    }

}

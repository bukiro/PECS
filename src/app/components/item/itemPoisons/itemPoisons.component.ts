import { Component, Input } from '@angular/core';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TimeService } from 'src/app/services/time.service';
import { Weapon } from 'src/app/classes/Weapon';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';

@Component({
    selector: 'app-itemPoisons',
    templateUrl: './itemPoisons.component.html',
    styleUrls: ['./itemPoisons.component.css'],
})
export class ItemPoisonsComponent {

    @Input()
    item: Weapon;
    @Input()
    itemStore = false;
    newPoison: { poison: AlchemicalPoison; inv: ItemCollection } = { poison: new AlchemicalPoison(), inv: null };

    public newPropertyRuneName: Array<string> = ['', '', ''];

    constructor(
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly itemsService: ItemsService,
        private readonly activitiesService: ActivitiesDataService,
        private readonly timeService: TimeService,
        private readonly typeService: TypeService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.character;
    }

    get_CleanItems() {
        return this.itemsService.cleanItems();
    }

    get_Duration(turns: number) {
        return this.timeService.durationDescription(turns);
    }

    get_Poisons() {
        const allPoisons: Array<{ poison: AlchemicalPoison; inv: ItemCollection }> = [{ poison: new AlchemicalPoison(), inv: null }];

        allPoisons[0].poison.name = '';

        if (this.itemStore) {
            allPoisons.push(...this.get_CleanItems().alchemicalpoisons.filter(poison => poison.traits.includes('Injury')).map(poison => ({ poison, inv: null })));
        } else {
            this.get_Character().inventories.forEach(inv => {
                allPoisons.push(...inv.alchemicalpoisons.filter(poison => poison.traits.includes('Injury')).map(poison => ({ poison, inv })));
            });
        }

        return allPoisons;
    }

    add_Poison() {
        if (this.newPoison.poison.name) {
            const item = this.item;

            item.poisonsApplied.length = 0;
            item.poisonsApplied.push(Object.assign<AlchemicalPoison, AlchemicalPoison>(new AlchemicalPoison(), JSON.parse(JSON.stringify(this.newPoison.poison))).recast(this.typeService, this.itemsService));

            if (this.newPoison.inv) {
                this.characterService.dropInventoryItem(this.get_Character(), this.newPoison.inv, this.newPoison.poison, false, false, false, 1);
            }

            this.newPoison = { poison: new AlchemicalPoison(), inv: null };
            this.newPoison.poison.name = '';
            this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
            this.refreshService.prepareChangesByItem(this.get_Character(), this.item, { characterService: this.characterService, activitiesService: this.activitiesService });
            this.refreshService.processPreparedChanges();
        }
    }

    remove_Poison(index: number) {
        this.item.poisonsApplied.splice(index, 1);
        this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this.refreshService.prepareChangesByItem(this.get_Character(), this.item, { characterService: this.characterService, activitiesService: this.activitiesService });
        this.refreshService.processPreparedChanges();
    }

}

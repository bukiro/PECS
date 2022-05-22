import { Component, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { Item } from 'src/app/classes/Item';
import { Oil } from 'src/app/classes/Oil';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { TimeService } from 'src/app/services/time.service';
import { Weapon } from 'src/app/classes/Weapon';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';

@Component({
    selector: 'app-itemOils',
    templateUrl: './itemOils.component.html',
    styleUrls: ['./itemOils.component.css'],
})
export class ItemOilsComponent {

    @Input()
    item: Item;
    @Input()
    itemStore = false;
    newOil: { oil: Oil; inv: ItemCollection } = { oil: new Oil(), inv: null };

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
        return this.characterService.character();
    }

    get_CleanItems() {
        return this.itemsService.cleanItems();
    }

    get_Duration(turns: number) {
        return this.timeService.getDurationDescription(turns);
    }

    get_Oils() {
        const item = this.item;
        const allOils: Array<{ oil: Oil; inv: ItemCollection }> = [{ oil: new Oil(), inv: null }];

        allOils[0].oil.name = '';

        if (this.itemStore) {
            allOils.push(...this.get_CleanItems().oils.filter(oil => oil.targets.length).map(oil => ({ oil, inv: null })));
        } else {
            this.get_Character().inventories.forEach(inv => {
                allOils.push(...inv.oils.filter(oil => oil.targets.length && oil.amount).map(oil => ({ oil, inv })));
            });
        }

        return allOils.filter(
            (oil: { oil: Oil; inv: ItemCollection }, index) =>
                index == 0 ||
                (
                    oil.oil.targets.length && (
                        oil.oil.targets.includes(item.type) ||
                        oil.oil.targets.includes('items')
                    ) && (
                        oil.oil.weightLimit ?
                            (
                                !(parseInt(item.bulk, 10)) ||
                                (
                                    item.bulk && parseInt(item.bulk, 10) <= oil.oil.weightLimit
                                )
                            )
                            : true
                    ) && (
                        oil.oil.rangereq ?
                            (
                                item[oil.oil.rangereq]
                            )
                            : true
                    ) && (
                        oil.oil.damagereq ?
                            (
                                item instanceof Weapon &&
                                item.dmgType &&
                                (
                                    oil.oil.damagereq.split('')
                                        .filter(req => item instanceof Weapon && item.dmgType.includes(req)).length ||
                                    item.dmgType == 'modular'
                                )
                            )
                            : true
                    )
                ),
        );
    }

    add_Oil() {
        if (this.newOil.oil.name) {
            const item = this.item;
            const newLength = item.oilsApplied.push(Object.assign<Oil, Oil>(new Oil(), JSON.parse(JSON.stringify(this.newOil.oil))).recast(this.typeService, this.itemsService));

            if (this.newOil.inv) {
                this.characterService.dropInventoryItem(this.get_Character(), this.newOil.inv, this.newOil.oil, false, false, false, 1);
            }

            //Add RuneLore if the oil's Rune Effect includes one
            if (item.oilsApplied[newLength - 1].runeEffect && item.oilsApplied[newLength - 1].runeEffect.loreChoices.length) {
                this.characterService.addRuneLore(item.oilsApplied[newLength - 1].runeEffect);
            }

            this.newOil = { oil: new Oil(), inv: null };
            this.newOil.oil.name = '';
            this.refreshService.set_ToChange('Character', 'inventory');
            this.refreshService.set_ItemViewChanges(this.get_Character(), this.item, { characterService: this.characterService, activitiesService: this.activitiesService });
            this.refreshService.process_ToChange();
        }
    }

    remove_Oil(index: number) {
        //Remove RuneLore if applicable.
        if (this.item.oilsApplied[index].runeEffect && this.item.oilsApplied[index].runeEffect.loreChoices.length) {
            this.characterService.removeRuneLore(this.item.oilsApplied[index].runeEffect);
        }

        this.item.oilsApplied.splice(index, 1);
        this.refreshService.set_ToChange('Character', 'inventory');
        this.refreshService.set_ItemViewChanges(this.get_Character(), this.item, { characterService: this.characterService, activitiesService: this.activitiesService });
        this.refreshService.process_ToChange();
    }

}

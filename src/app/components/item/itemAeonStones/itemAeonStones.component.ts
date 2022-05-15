import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { TimeService } from 'src/app/services/time.service';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';

@Component({
    selector: 'app-itemAeonStones',
    templateUrl: './itemAeonStones.component.html',
    styleUrls: ['./itemAeonStones.component.css'],
})
export class ItemAeonStonesComponent implements OnInit {

    @Input()
    item: WornItem;
    @Input()
    itemStore = false;

    public newAeonStone: Array<{ aeonStone: WornItem; inv: ItemCollection }>;

    constructor(
        public characterService: CharacterService,
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
        return this.itemsService.get_CleanItems();
    }

    get_Slots() {
        const indexes: Array<number> = [];

        for (let index = 0; index < this.item.isWayfinder; index++) {
            indexes.push(index);
        }

        return indexes;
    }

    get_Inventories() {
        if (this.itemStore) {
            return [this.get_CleanItems()];
        } else {
            return this.get_Character().inventories;
        }
    }

    get_InitialAeonStones(index: number) {
        const item = this.item;
        //Start with one empty stone to select nothing.
        const allStones: Array<{ aeonStone: WornItem; inv: ItemCollection }> = [{ aeonStone: new WornItem(), inv: null }];

        allStones[0].aeonStone.name = '';

        //Add the current choice, if the item has a stone at that index.
        if (item.aeonStones[index]) {
            allStones.push(this.newAeonStone[index] as { aeonStone: WornItem; inv: ItemCollection });
        }

        return allStones;
    }

    get_AeonStones(inv: ItemCollection) {
        if (this.itemStore) {
            return inv.wornitems.filter(wornItem => wornItem.isAeonStone).map(aeonStone => ({ aeonStone, inv: null }));
        } else {
            return inv.wornitems.filter(wornItem => wornItem.isAeonStone).map(aeonStone => ({ aeonStone, inv }));
        }
    }

    get_AeonStoneCooldown(stone: WornItem) {
        //If any resonant activity on this aeon Stone has a cooldown, return the lowest of these in a human readable format.
        if (stone.activities && stone.activities.length && stone.activities.some(activity => activity.resonant && activity.activeCooldown)) {
            const lowestCooldown = Math.min(...stone.activities.filter(activity => activity.resonant && activity.activeCooldown).map(activity => activity.activeCooldown));

            return ` (Cooldown: ${ this.timeService.getDurationDescription(lowestCooldown) })`;
        } else {
            return '';
        }
    }

    add_AeonStone(index: number) {
        const item: WornItem = this.item;
        const stone: WornItem = this.newAeonStone[index].aeonStone;
        const inv: ItemCollection = this.newAeonStone[index].inv;

        if (!item.aeonStones[index] || stone !== item.aeonStones[index]) {
            //If there is an Aeon Stone in this slot, return the old stone to the inventory, unless we are in the item store. Then remove it from the item.
            if (item.aeonStones[index]) {
                if (!this.itemStore) {
                    this.remove_AeonStone(index);
                }

                item.aeonStones.splice(index, 1);
            }

            //Then add the new Aeon Stone to the item and (unless we are in the item store) remove it from the inventory.
            if (stone.name != '') {
                //Add a copy of the stone to the item
                const newLength = item.aeonStones.push(Object.assign<WornItem, WornItem>(new WornItem(), JSON.parse(JSON.stringify(stone))).recast(this.typeService, this.itemsService));
                const newStone = item.aeonStones[newLength - 1];

                newStone.amount = 1;
                newStone.isSlottedAeonStone = true;

                //If we are not in the item store, remove the inserted Aeon Stone from the inventory, either by decreasing the amount or by dropping the item.
                if (!this.itemStore) {
                    this.characterService.dropInventoryItem(this.get_Character(), inv, stone, false, false, false, 1);
                }
            }
        }

        this.set_ToChange(stone);
        this.set_AeonStoneNames();
        this.refreshService.process_ToChange();
    }

    remove_AeonStone(index: number) {
        const character = this.get_Character();
        const item: WornItem = this.item;
        const oldStone: WornItem = item.aeonStones[index];

        oldStone.isSlottedAeonStone = false;
        this.set_ToChange(oldStone);
        //Add the extracted stone back to the inventory.
        this.characterService.grantInventoryItem(oldStone, { creature: character, inventory: character.inventories[0] }, { resetRunes: false, changeAfter: false, equipAfter: false });
    }

    set_ToChange(stone: WornItem) {
        this.refreshService.set_ItemViewChanges(this.get_Character(), stone, { characterService: this.characterService, activitiesService: this.activitiesService });
    }

    get_Title(stone: WornItem) {
        if (this.itemStore && stone.price) {
            return `Price ${ this.get_Price(stone) }`;
        }
    }

    get_Price(stone: WornItem) {
        if (stone.price) {
            if (stone.price == 0) {
                return '';
            } else {
                let price: number = stone.price;
                let priceString = '';

                if (price >= 100) {
                    priceString += `${ Math.floor(price / 100) }gp`;
                    price %= 100;

                    if (price >= 10) { priceString += ' '; }
                }

                if (price >= 10) {
                    priceString += `${ Math.floor(price / 10) }sp`;
                    price %= 10;

                    if (price >= 1) { priceString += ' '; }
                }

                if (price >= 1) {
                    priceString += `${ price }cp`;
                }

                return priceString;
            }
        } else {
            return '';
        }
    }

    set_AeonStoneNames() {
        this.newAeonStone =
            (this.item.aeonStones ? [
                (this.item.aeonStones[0] ? { aeonStone: this.item.aeonStones[0], inv: null } : { aeonStone: new WornItem(), inv: null }),
                (this.item.aeonStones[1] ? { aeonStone: this.item.aeonStones[1], inv: null } : { aeonStone: new WornItem(), inv: null }),
            ] : [{ aeonStone: new WornItem(), inv: null }, { aeonStone: new WornItem(), inv: null }]);
        this.newAeonStone.filter(stone => stone.aeonStone.name == 'New Item').forEach(stone => {
            stone.aeonStone.name = '';
        });
    }

    public ngOnInit(): void {
        this.set_AeonStoneNames();
    }

}

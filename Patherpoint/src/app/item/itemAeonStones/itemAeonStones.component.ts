import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { WornItem } from 'src/app/WornItem';
import { ItemCollection } from 'src/app/ItemCollection';
import { TimeService } from 'src/app/time.service';

@Component({
    selector: 'app-itemAeonStones',
    templateUrl: './itemAeonStones.component.html',
    styleUrls: ['./itemAeonStones.component.css']
})
export class ItemAeonStonesComponent implements OnInit {

    @Input()
    item: WornItem;
    @Input()
    itemStore: boolean = false;

    public newAeonStone: { aeonStone: WornItem, inv: ItemCollection }[];

    constructor(
        public characterService: CharacterService,
        private itemsService: ItemsService,
        private timeService: TimeService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CleanItems() {
        return this.itemsService.get_CleanItems();
    }

    get_Slots() {
        let indexes: number[] = [];
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
        let item = this.item;
        //Start with one empty stone to select nothing.
        let allStones: { aeonStone: WornItem, inv: ItemCollection }[] = [{ aeonStone: new WornItem(), inv: null }];
        allStones[0].aeonStone.name = "";
        //Add the current choice, if the item has a rune at that index.
        if (item.aeonStones[index]) {
            allStones.push(this.newAeonStone[index] as { aeonStone: WornItem, inv: ItemCollection });
        }
        return allStones;
    }

    get_AeonStones(inv: ItemCollection) {
        if (this.itemStore) {
            return inv.wornitems.filter(wornItem => wornItem.isAeonStone).map(aeonStone => ({ aeonStone: aeonStone, inv: null }));
        } else {
            return inv.wornitems.filter(wornItem => wornItem.isAeonStone).map(aeonStone => ({ aeonStone: aeonStone, inv: inv }));
        }
    }

    get_AeonStoneCooldown(stone: WornItem) {
        //If any resonant activity on this aeon Stone has a cooldown, return the lowest of these in a human readable format.
        if (stone.activities && stone.activities.length && stone.activities.filter(activity => activity.resonant && activity.activeCooldown).length) {
            let lowestCooldown = Math.min(...stone.activities.filter(activity => activity.resonant && activity.activeCooldown).map(activity => activity.activeCooldown));
            return " (Cooldown: "+this.timeService.get_Duration(lowestCooldown)+")";
        } else {
            return "";
        }
    }

    add_AeonStone(index: number) {
        let item: WornItem = this.item;
        let stone: WornItem = this.newAeonStone[index].aeonStone;
        let inv: ItemCollection = this.newAeonStone[index].inv;
        if (!item.aeonStones[index] || stone !== item.aeonStones[index]) {
            //If there is an Aeon Stone in this slot, return the old stone to the inventory, unless we are in the item store. Then remove it from the item.
            if (item.aeonStones[index]) {
                if (!this.itemStore) {
                    this.remove_AeonStone(index);
                }
                item.aeonStones.splice(index, 1);
            }
            //Then add the new Aeon Stone to the item and (unless we are in the item store) remove it from the inventory.
            if (stone.name != "") {
                //Add a copy of the stone to the item
                let newLength = item.aeonStones.push(Object.assign(new WornItem, JSON.parse(JSON.stringify(stone))));
                item.aeonStones[newLength - 1] = this.characterService.reassign(item.aeonStones[newLength - 1]);
                let newStone = item.aeonStones[newLength - 1];
                newStone.amount = 1;
                //If we are not in the item store, remove the inserted Aeon Stone from the inventory, either by decreasing the amount or by dropping the item.
                if (!this.itemStore) {
                    this.characterService.drop_InventoryItem(this.get_Character(), inv, stone, false, false, false, 1);
                }
            }
        }
        this.set_AeonStoneNames();
        this.characterService.set_Changed();
    }

    remove_AeonStone(index: number) {
        let item: WornItem = this.item;
        let oldStone: WornItem = item.aeonStones[index];
        //Add the extracted stone to the inventory, either on an existing stack or as a new item.
        this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], oldStone, false, false, false, 1);
    }

    set_AeonStoneNames() {
        this.newAeonStone = 
        (this.item.aeonStones ? [
            (this.item.aeonStones[0] ? { aeonStone: this.item.aeonStones[0], inv: null } : { aeonStone: new WornItem(), inv: null }),
            (this.item.aeonStones[1] ? { aeonStone: this.item.aeonStones[1], inv: null } : { aeonStone: new WornItem(), inv: null }),
        ] : [{ aeonStone: new WornItem(), inv: null }, { aeonStone: new WornItem(), inv: null }]);
        this.newAeonStone.filter(stone => stone.aeonStone.name == "New Item").forEach(stone => {
            stone.aeonStone.name = "";
        });
    }

    ngOnInit() {
        this.set_AeonStoneNames();
    }

}
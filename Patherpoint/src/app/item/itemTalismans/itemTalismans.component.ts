import { Component, OnInit, Input } from '@angular/core';
import { Talisman } from 'src/app/Talisman';
import { ItemCollection } from 'src/app/ItemCollection';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { Equipment } from 'src/app/Equipment';
import { Weapon } from 'src/app/Weapon';
import { Armor } from 'src/app/Armor';
import { Shield } from 'src/app/Shield';

@Component({
    selector: 'app-itemTalismans',
    templateUrl: './itemTalismans.component.html',
    styleUrls: ['./itemTalismans.component.css']
})
export class ItemTalismansComponent implements OnInit {

    @Input()
    item: Equipment;
    @Input()
    itemStore: boolean = false;
    newTalisman: { talisman: Talisman, inv: ItemCollection }[];

    public newPropertyRuneName: string[] = ["", "", ""];

    constructor(
        public characterService: CharacterService,
        private itemsService: ItemsService
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
        for (let index = 0; index < this.item.talismans.length; index++) {
            indexes.push(index);
        }
        //If Talismans are available, add one more slot.
        if (this.itemStore || this.get_Character().inventories.filter(inv => this.get_Talismans(inv).length).length) {
            indexes.push(indexes.length);
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

    get_InitialTalismans(index: number) {
        let item = this.item;
        //Start with one empty talisman to select nothing.
        let allTalismans: { talisman: Talisman, inv: ItemCollection }[] = [{ talisman: new Talisman(), inv: null }];
        allTalismans[0].talisman.name = "";
        //Add the current choice, if the item has a rune at that index.
        if (item.talismans[index]) {
            allTalismans.push(this.newTalisman[index] as { talisman: Talisman, inv: ItemCollection });
        }
        return allTalismans;
    }

    get_Talismans(inv: ItemCollection) {
        return inv.talismans.filter(talisman => talisman.targets.length && talisman.amount)
            .map(talisman => ({ talisman: talisman, inv: (this.itemStore ? null : inv) }))
            .filter((talisman: { talisman: Talisman, inv: ItemCollection }, index) =>
                    talisman.talisman.targets.length &&
                    talisman.talisman.targets.includes(this.item.type)
            );
    }

    add_Talisman(index: number) {
        let item: Equipment = this.item;
        let talisman: Talisman = this.newTalisman[index].talisman;
        let inv: ItemCollection = this.newTalisman[index].inv;
        if (!item.talismans[index] || talisman !== item.talismans[index]) {
            //If there is a Talisman in this slot, return the old one to the inventory, unless we are in the item store. Then remove it from the item.
            if (item.talismans[index]) {
                if (!this.itemStore) {
                    this.remove_Talisman(index);
                }
                item.talismans.splice(index, 1);
            }
            //Then add the new Aeon Stone to the item and (unless we are in the item store) remove it from the inventory.
            if (talisman.name != "") {
                //Add a copy of the stone to the item
                let newLength = item.talismans.push(Object.assign(new Talisman, JSON.parse(JSON.stringify(talisman))));
                item.talismans[newLength - 1] = this.characterService.reassign(item.talismans[newLength - 1]);
                let newStone = item.talismans[newLength - 1];
                newStone.amount = 1;
                //If we are not in the item store, remove the inserted Aeon Stone from the inventory, either by decreasing the amount or by dropping the item.
                if (!this.itemStore) {
                    this.characterService.drop_InventoryItem(this.get_Character(), inv, talisman, false, false, false, 1);
                }
            }
        }
        this.characterService.set_ToChange("Character", "inventory");
        if (this.item.constructor == Weapon) {
            this.characterService.set_ToChange("Character", "attacks");
        }
        if (this.item.constructor == Armor && this.item.constructor == Shield) {
            this.characterService.set_ToChange("Character", "defense");
        }
        this.set_TalismanNames();
        this.characterService.process_ToChange();
    }

    remove_Talisman(index: number) {
        let item: Equipment = this.item;
        let oldTalisman: Talisman = item.talismans[index];
        //Add the extracted stone to the inventory, either on an existing stack or as a new item.
        this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], oldTalisman, false, false, false, 1);
    }

    set_TalismanNames() {
        this.newTalisman = 
        (this.item.talismans ? [
            (this.item.talismans[0] ? { talisman: this.item.talismans[0], inv: null } : { talisman: new Talisman(), inv: null }),
            (this.item.talismans[1] ? { talisman: this.item.talismans[1], inv: null } : { talisman: new Talisman(), inv: null }),
        ] : [{ talisman: new Talisman(), inv: null }, { talisman: new Talisman(), inv: null }]);
        this.newTalisman.filter(talisman => talisman.talisman.name == "New Item").forEach(talisman => {
            talisman.talisman.name = "";
        });
    }

    ngOnInit() {
        this.set_TalismanNames();
    }

}

import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { WornItem } from 'src/app/WornItem';
import { ItemCollection } from 'src/app/ItemCollection';
import { Equipment } from 'src/app/Equipment';
import { Weapon } from 'src/app/Weapon';
import { Armor } from 'src/app/Armor';
import { Shield } from 'src/app/Shield';

@Component({
    selector: 'app-itemTalismanCords',
    templateUrl: './itemTalismanCords.component.html',
    styleUrls: ['./itemTalismanCords.component.css']
})
export class ItemTalismanCordsComponent implements OnInit {

    @Input()
    item: Equipment;
    
    public newTalismanCord: { talismanCord: WornItem, inv: ItemCollection }[];

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
        return [0];
    }

    get_Inventories() {
        return this.get_Character().inventories;
    }

    get_InitialTalismanCords(index: number) {
        let item = this.item;
        //Start with one empty cord to select nothing.
        let allCords: { talismanCord: WornItem, inv: ItemCollection }[] = [{ talismanCord: new WornItem(), inv: null }];
        allCords[0].talismanCord.name = "";
        //Add the current choice, if the item has a cord at that index.
        if (item.talismanCords[index]) {
            allCords.push(this.newTalismanCord[index] as { talismanCord: WornItem, inv: ItemCollection });
        }
        return allCords;
    }

    get_TalismanCords(inv: ItemCollection) {
        return inv.wornitems.filter(wornItem => wornItem.isTalismanCord).map(talismanCord => ({ talismanCord: talismanCord, inv: inv }));
    }

    get_TalismanCordSchools(cord: WornItem) {
        if (cord.data?.length && cord.data.some((data, index) => index <= cord.isTalismanCord && data.value != "no school attuned")) {
            return cord.data.filter((data, index) => index <= cord.isTalismanCord && data.value != "no school attuned").map(data => data.value.toString()).join(", ");
        } else {
            return "no school attuned";
        }
    }

    add_TalismanCord(index: number) {
        let item: Equipment = this.item;
        let cord: WornItem = this.newTalismanCord[index].talismanCord;
        let inv: ItemCollection = this.newTalismanCord[index].inv;
        if (!item.talismanCords[index] || cord !== item.talismanCords[index]) {
            //If there is an Talisman Cord in this slot, return the old cord to the inventory, unless we are in the item store. Then remove it from the item.
            if (item.talismanCords[index]) {
                this.remove_TalismanCord(index);
                item.talismanCords.splice(index, 1);
            }
            //Then add the new Talisman Cord to the item and (unless we are in the item store) remove it from the inventory.
            if (cord.name != "") {
                //Add a copy of the cord to the item
                let newLength = item.talismanCords.push(Object.assign(new WornItem, JSON.parse(JSON.stringify(cord))));
                item.talismanCords[newLength - 1] = this.characterService.reassign(item.talismanCords[newLength - 1]);
                let newCord = item.talismanCords[newLength - 1];
                newCord.amount = 1;
                //Remove the inserted Talisman Cord from the inventory, either by decreasing the amount or by dropping the item.
                this.characterService.drop_InventoryItem(this.get_Character(), inv, cord, false, false, false, 1);
            }
        }
        this.set_ToChange();
        this.set_TalismanCordNames();
        this.characterService.process_ToChange();
    }

    remove_TalismanCord(index: number) {
        let item: Equipment = this.item;
        let oldCord: WornItem = item.talismanCords[index];
        //Add the extracted cord to the inventory, either on an existing stack or as a new item.
        this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], oldCord, false, false, false, 1);
    }

    set_ToChange() {
        this.characterService.set_ToChange("Character", "inventory");
        if (this.item instanceof Weapon) {
            this.characterService.set_ToChange("Character", "attacks");
        }
        if (this.item instanceof Armor || this.item instanceof Shield) {
            this.characterService.set_ToChange("Character", "defense");
        }
        this.characterService.set_ToChange("Character", this.item.id);
    }

    set_TalismanCordNames() {
        this.newTalismanCord = 
        (this.item.talismanCords ? [
            (this.item.talismanCords[0] ? { talismanCord: this.item.talismanCords[0], inv: null } : { talismanCord: new WornItem(), inv: null })
        ] : [{ talismanCord: new WornItem(), inv: null }]);
        this.newTalismanCord.filter(cord => cord.talismanCord.name == "New Item").forEach(cord => {
            cord.talismanCord.name = "";
        });
    }

    ngOnInit() {
        this.set_TalismanCordNames();
    }

}
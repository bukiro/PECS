import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Equipment } from 'src/app/classes/Equipment';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';

@Component({
    selector: 'app-itemTalismanCords',
    templateUrl: './itemTalismanCords.component.html',
    styleUrls: ['./itemTalismanCords.component.scss'],
})
export class ItemTalismanCordsComponent implements OnInit {

    @Input()
    item: Equipment;

    public newTalismanCord: Array<{ talismanCord: WornItem; inv: ItemCollection }>;

    constructor(
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly itemsService: ItemsService,
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

    get_Slots() {
        return [0];
    }

    get_Inventories() {
        return this.get_Character().inventories;
    }

    get_InitialTalismanCords(index: number) {
        const item = this.item;
        //Start with one empty cord to select nothing.
        const allCords: Array<{ talismanCord: WornItem; inv: ItemCollection }> = [{ talismanCord: new WornItem(), inv: null }];

        allCords[0].talismanCord.name = '';

        //Add the current choice, if the item has a cord at that index.
        if (item.talismanCords[index]) {
            allCords.push(this.newTalismanCord[index] as { talismanCord: WornItem; inv: ItemCollection });
        }

        return allCords;
    }

    get_TalismanCords(inv: ItemCollection) {
        return inv.wornitems.filter(wornItem => wornItem.isTalismanCord).map(talismanCord => ({ talismanCord, inv }));
    }

    get_TalismanCordSchools(cord: WornItem) {
        if (cord.data?.length && cord.data.some((data, index) => index <= cord.isTalismanCord && data.value != 'no school attuned')) {
            return cord.data.filter((data, index) => index <= cord.isTalismanCord && data.value != 'no school attuned').map(data => data.value.toString())
                .join(', ');
        } else {
            return 'no school attuned';
        }
    }

    add_TalismanCord(index: number) {
        const item: Equipment = this.item;
        const cord: WornItem = this.newTalismanCord[index].talismanCord;
        const inv: ItemCollection = this.newTalismanCord[index].inv;

        if (!item.talismanCords[index] || cord !== item.talismanCords[index]) {
            //If there is an Talisman Cord in this slot, return the old cord to the inventory, unless we are in the item store. Then remove it from the item.
            if (item.talismanCords[index]) {
                this.remove_TalismanCord(index);
                item.talismanCords.splice(index, 1);
            }

            //Then add the new Talisman Cord to the item and (unless we are in the item store) remove it from the inventory.
            if (cord.name != '') {
                //Add a copy of the cord to the item
                const newLength = item.talismanCords.push(Object.assign<WornItem, WornItem>(new WornItem(), JSON.parse(JSON.stringify(cord))).recast(this.typeService, this.itemsService));
                const newCord = item.talismanCords[newLength - 1];

                newCord.amount = 1;
                //Remove the inserted Talisman Cord from the inventory, either by decreasing the amount or by dropping the item.
                this.characterService.dropInventoryItem(this.get_Character(), inv, cord, false, false, false, 1);
            }
        }

        this.set_ToChange();
        this.set_TalismanCordNames();
        this.refreshService.processPreparedChanges();
    }

    remove_TalismanCord(index: number) {
        const character = this.get_Character();
        const item = this.item;
        const oldCord = item.talismanCords[index];

        //Add the extracted cord back to the inventory.
        this.characterService.grantInventoryItem(oldCord, { creature: character, inventory: character.inventories[0] }, { resetRunes: false, changeAfter: false, equipAfter: false });
    }

    set_ToChange() {
        this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');

        if (this.item instanceof Weapon) {
            this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        }

        if (this.item instanceof Armor || this.item instanceof Shield || this.item instanceof WornItem) {
            this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
        }

        this.refreshService.prepareDetailToChange(CreatureTypes.Character, this.item.id);
    }

    set_TalismanCordNames() {
        this.newTalismanCord =
            (this.item.talismanCords ? [
                (this.item.talismanCords[0] ? { talismanCord: this.item.talismanCords[0], inv: null } : { talismanCord: new WornItem(), inv: null }),
            ] : [{ talismanCord: new WornItem(), inv: null }]);
        this.newTalismanCord.filter(cord => cord.talismanCord.name == 'New Item').forEach(cord => {
            cord.talismanCord.name = '';
        });
    }

    public ngOnInit(): void {
        this.set_TalismanCordNames();
    }

}

import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ItemsService } from 'src/app/services/items.service';
import { Talisman } from 'src/app/classes/Talisman';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Equipment } from 'src/app/classes/Equipment';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from 'src/app/classes/WornItem';

type TalismanOption = {
    talisman: Talisman,
    inv: ItemCollection,
    talismanCordCompatible: boolean
}

@Component({
    selector: 'app-itemTalismans',
    templateUrl: './itemTalismans.component.html',
    styleUrls: ['./itemTalismans.component.css']
})
export class ItemTalismansComponent implements OnInit {

    @Input()
    item: Equipment;
    @Input()
    itemStore = false;
    newTalisman: TalismanOption[];

    constructor(
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private itemsService: ItemsService,
        private typeService: TypeService
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CleanItems() {
        return this.itemsService.get_CleanItems();
    }

    get_Slots() {
        //Items can have one talisman.
        //Add as many slots as the item has talismans inserted (should be one, but just in case).
        //If none are inserted, add one slot as long as any talismans are available to insert.
        const indexes: number[] = [];
        if (this.item.talismans.length) {
            for (let index = 0; index < this.item.talismans.length; index++) {
                indexes.push(index);
            }
        } else if (this.itemStore || this.get_Character().inventories.some(inv => inv.talismans.length)) {
            indexes.push(0);
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
        const item = this.item;
        //Start with one empty talisman to select nothing.
        const allTalismans: TalismanOption[] = [{ talisman: new Talisman(), inv: null, talismanCordCompatible: false }];
        allTalismans[0].talisman.name = '';
        //Add the current choice, if the item has a talisman at that index.
        if (item.talismans[index]) {
            allTalismans.push(Object.assign(this.newTalisman[index], { talismanCordCompatible: this.get_CompatibleWithTalismanCord(this.newTalisman[index].talisman) }));
        }
        return allTalismans;
    }

    get_Talismans(inv: ItemCollection): TalismanOption[] {
        return inv.talismans.filter(talisman => talisman.targets.length && talisman.amount)
            .map(talisman => ({
                talisman: talisman,
                inv: (this.itemStore ? null : inv),
                talismanCordCompatible: this.get_CompatibleWithTalismanCord(talisman)
            }))
            .filter(talisman =>
                talisman.talisman.targets.length &&
                (
                    talisman.talisman.targets.includes(this.item.type) ||
                    (
                        //One exception: The jade bauble is affixed to a melee weapon, which is not a weapon type.
                        this.item instanceof Weapon && this.item.melee && talisman.talisman.targets.includes('melee weapons')
                    ) ||
                    (
                        //Two exceptions: Worn items with the bracers of armor functionality can attach armor talismans.
                        this.item instanceof WornItem && this.item.isBracersOfArmor && talisman.talisman.targets.includes('armors')
                    )
                )
            )
            .sort((a, b) => (a.talisman.level + a.talisman.name == b.talisman.level + b.talisman.name) ? 0 : ((a.talisman.level + a.talisman.name > b.talisman.level + b.talisman.name) ? 1 : -1));
    }

    get_CompatibleWithTalismanCord(talisman: Talisman) {
        return this.item.talismanCords
            .some(cord =>
                cord.get_CompatibleWithTalisman(talisman)
            );
    }

    add_Talisman(index: number) {
        const item: Equipment = this.item;
        const talisman: Talisman = this.newTalisman[index].talisman;
        const inv: ItemCollection = this.newTalisman[index].inv;
        if (!item.talismans[index] || talisman !== item.talismans[index]) {
            //If there is a Talisman in this slot, return the old one to the inventory, unless we are in the item store. Then remove it from the item.
            if (item.talismans[index]) {
                if (!this.itemStore) {
                    this.remove_Talisman(index);
                }
                item.talismans.splice(index, 1);
            }
            //Then add the new Talisman to the item and (unless we are in the item store) remove it from the inventory.
            if (talisman.name != '') {
                //Add a copy of Talisman to the item
                const newLength = item.talismans.push(Object.assign<Talisman, Talisman>(new Talisman(), JSON.parse(JSON.stringify(talisman))).recast(this.typeService, this.itemsService));
                const newTalisman = item.talismans[newLength - 1];
                newTalisman.amount = 1;
                //If we are not in the item store, remove the inserted Talisman from the inventory, either by decreasing the amount or by dropping the item.
                if (!this.itemStore) {
                    this.characterService.drop_InventoryItem(this.get_Character(), inv, talisman, false, false, false, 1);
                }
            }
        }
        this.refreshService.set_ToChange('Character', 'inventory');
        if (this.item instanceof Weapon) {
            this.refreshService.set_ToChange('Character', 'attacks');
        }
        if (this.item instanceof Armor || this.item instanceof Shield || this.item instanceof WornItem) {
            this.refreshService.set_ToChange('Character', 'defense');
        }
        this.set_TalismanNames();
        this.refreshService.set_ToChange('Character', this.item.id);
        this.refreshService.process_ToChange();
    }

    remove_Talisman(index: number) {
        const character = this.get_Character();
        const oldTalisman = this.item.talismans[index];
        //Add the extracted stone back to the inventory.
        this.characterService.grant_InventoryItem(oldTalisman, { creature: character, inventory: character.inventories[0] }, { resetRunes: false, changeAfter: false, equipAfter: false });
    }

    get_Title(talisman: Talisman, talismanCordCompatible: boolean) {
        const parts: string[] = [];
        if (this.itemStore && talisman.price) {
            parts.push(`Price ${ this.get_Price(talisman) }`);
        }
        if (talismanCordCompatible) {
            parts.push('Compatible with equipped talisman cord');
        }
        return parts.join('; ');
    }

    get_Price(talisman: Talisman) {
        if (talisman.price) {
            if (talisman.price == 0) {
                return '';
            } else {
                let price: number = talisman.price;
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

    set_TalismanNames() {
        this.newTalisman = [];
        if (this.item.talismans) {
            for (let index = 0; index < this.item.talismans.length; index++) {
                if (this.item.talismans[index]) {
                    this.newTalisman.push({ talisman: this.item.talismans[index], inv: null, talismanCordCompatible: this.get_CompatibleWithTalismanCord(this.item.talismans[index]) });
                } else {
                    this.newTalisman.push({ talisman: new Talisman(), inv: null, talismanCordCompatible: false });
                }
            }
        } else {
            this.newTalisman = [{ talisman: new Talisman(), inv: null, talismanCordCompatible: false }];
        }
        this.newTalisman.filter(talisman => talisman.talisman.name == 'New Item').forEach(talisman => {
            talisman.talisman.name = '';
        });
    }

    ngOnInit() {
        this.set_TalismanNames();
    }

}

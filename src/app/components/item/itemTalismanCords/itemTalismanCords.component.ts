import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
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
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

interface TalismanCordSet {
    talismanCord: WornItem;
    inv: ItemCollection;
}

@Component({
    selector: 'app-itemTalismanCords',
    templateUrl: './itemTalismanCords.component.html',
    styleUrls: ['./itemTalismanCords.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemTalismanCordsComponent implements OnInit {

    @Input()
    public item: Equipment;

    public newTalismanCord: TalismanCordSet;

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemsService: ItemsService,
        private readonly _typeService: TypeService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return this._characterService.character;
    }

    public inventories(): Array<ItemCollection> {
        return this._character.inventories;
    }

    public inventoryName(inv: ItemCollection): string {
        return inv.effectiveName(this._characterService);
    }

    public initialTalismanCords(): Array<TalismanCordSet> {
        const item = this.item;
        //Start with one empty cord to select nothing.
        const allCords: Array<TalismanCordSet> = [{ talismanCord: new WornItem(), inv: null }];

        allCords[0].talismanCord.name = '';

        //Add the current choice, if the item has a cord at that index.
        if (item.talismanCords) {
            allCords.push(this.newTalismanCord);
        }

        return allCords;
    }

    public availableTalismanCords(inv: ItemCollection): Array<TalismanCordSet> {
        return inv.wornitems.filter(wornItem => wornItem.isTalismanCord).map(talismanCord => ({ talismanCord, inv }));
    }

    public talismanCordSchools(cord: WornItem): string {
        const cordSchools = cord.data?.filter((data, index) => index <= cord.isTalismanCord && data.value !== 'no school attuned');

        if (cord.data?.length && cordSchools.length) {
            return cordSchools
                .map(data => data.value.toString())
                .join(', ');
        } else {
            return 'no school attuned';
        }
    }

    public onSelectTalismanCord(): void {
        const index = 0;
        const item: Equipment = this.item;
        const cord: WornItem = this.newTalismanCord[index].talismanCord;
        const inv: ItemCollection = this.newTalismanCord[index].inv;

        if (!item.talismanCords[index] || cord !== item.talismanCords[index]) {
            // If there is an Talisman Cord in this slot, return the old cord to the inventory,
            // unless we are in the item store. Then remove it from the item.
            if (item.talismanCords[index]) {
                this._removeTalismanCord(index);
                item.talismanCords.splice(index, 1);
            }

            // Then add the new Talisman Cord to the item and (unless we are in the item store) remove it from the inventory.
            if (cord.name !== '') {
                //Add a copy of the cord to the item
                const newLength = item.talismanCords.push(
                    Object.assign(
                        new WornItem(),
                        JSON.parse(JSON.stringify(cord)),
                    ).recast(this._typeService, this._itemsService));
                const newCord = item.talismanCords[newLength - 1];

                newCord.amount = 1;
                //Remove the inserted Talisman Cord from the inventory, either by decreasing the amount or by dropping the item.
                this._characterService.dropInventoryItem(this._character, inv, cord, false, false, false, 1);
            }
        }

        this._prepareToChange();
        this._setTalismanCordNames();
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._setTalismanCordNames();
    }

    private _removeTalismanCord(index: number): void {
        const character = this._character;
        const item = this.item;
        const oldCord = item.talismanCords[index];

        //Add the extracted cord back to the inventory.
        this._characterService.grantInventoryItem(
            oldCord,
            { creature: character, inventory: character.inventories[0] },
            { resetRunes: false, changeAfter: false, equipAfter: false },
        );
    }

    private _prepareToChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');

        if (this.item instanceof Weapon) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        }

        if (this.item instanceof Armor || this.item instanceof Shield || this.item instanceof WornItem) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, this.item.id);
    }

    private _setTalismanCordNames(): void {
        this.newTalismanCord =
            this.item.talismanCords
                ? (
                    this.item.talismanCords[0]
                        ? { talismanCord: this.item.talismanCords[0], inv: null }
                        : { talismanCord: new WornItem(), inv: null }
                )
                : { talismanCord: new WornItem(), inv: null };

        if (this.newTalismanCord.talismanCord.name === 'New Item') {
            this.newTalismanCord.talismanCord.name = '';
        }
    }

}

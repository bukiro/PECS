import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Equipment } from 'src/app/classes/Equipment';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

interface TalismanCordSet {
    talismanCord: WornItem;
    inv?: ItemCollection;
}

@Component({
    selector: 'app-itemTalismanCords',
    templateUrl: './itemTalismanCords.component.html',
    styleUrls: ['./itemTalismanCords.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemTalismanCordsComponent implements OnInit {

    @Input()
    public item!: Equipment;

    public newTalismanCord?: TalismanCordSet;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _inventoryService: InventoryService,
        private readonly _recastService: RecastService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return CreatureService.character;
    }

    public inventories(): Array<ItemCollection> {
        return this._character.inventories;
    }

    public inventoryName(inv: ItemCollection): string {
        return this._inventoryPropertiesService.effectiveName(inv, this._character);
    }

    public initialTalismanCords(): Array<TalismanCordSet> {
        const item = this.item;
        //Start with one empty cord to select nothing.
        const allCords: Array<TalismanCordSet> = [{ talismanCord: new WornItem(), inv: undefined }];

        allCords[0].talismanCord.name = '';

        //Add the current choice, if the item has a cord at that index.
        if (item.talismanCords && this.newTalismanCord) {
            allCords.push(this.newTalismanCord);
        }

        return allCords;
    }

    public availableTalismanCords(inv: ItemCollection): Array<TalismanCordSet> {
        const twoDigits = 2;

        return inv.wornitems.filter(wornItem => wornItem.isTalismanCord)
            .map(talismanCord => ({ talismanCord, inv }))
            .sort((a, b) => SortAlphaNum(
                a.talismanCord.level.toString().padStart(twoDigits, '0') + a.talismanCord.name,
                b.talismanCord.level.toString().padStart(twoDigits, '0') + b.talismanCord.name,
            ));
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
        const cord: WornItem | undefined = this.newTalismanCord?.talismanCord;
        const inv: ItemCollection | undefined = this.newTalismanCord?.inv;

        if (inv && cord && (!item.talismanCords[index] || cord !== item.talismanCords[index])) {
            // If there is an Talisman Cord in this slot, return the old cord to the inventory,
            // unless we are in the item store. Then remove it from the item.
            if (item.talismanCords[index]) {
                this._removeTalismanCord(index);
                item.talismanCords.splice(index, 1);
            }

            // Then add the new Talisman Cord to the item and (unless we are in the item store) remove it from the inventory.
            if (cord.name !== '') {
                //Add a copy of the cord to the item
                const newLength = item.talismanCords.push(cord.clone(this._recastService.recastOnlyFns));
                const newCord = item.talismanCords[newLength - 1];

                newCord.amount = 1;
                //Remove the inserted Talisman Cord from the inventory, either by decreasing the amount or by dropping the item.
                this._inventoryService.dropInventoryItem(this._character, inv, cord, false, false, false, 1);
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
        this._inventoryService.grantInventoryItem(
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
                        ? { talismanCord: this.item.talismanCords[0], inv: undefined }
                        : { talismanCord: new WornItem(), inv: undefined }
                )
                : { talismanCord: new WornItem(), inv: undefined };

        if (this.newTalismanCord.talismanCord.name === 'New Item') {
            this.newTalismanCord.talismanCord.name = '';
        }
    }

}

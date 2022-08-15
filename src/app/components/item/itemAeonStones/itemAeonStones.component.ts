import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { PriceTextFromCopper } from 'src/libs/shared/util/currencyUtils';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';

interface AeonStoneSet {
    aeonStone: WornItem;
    inv: ItemCollection;
}

@Component({
    selector: 'app-itemAeonStones',
    templateUrl: './itemAeonStones.component.html',
    styleUrls: ['./itemAeonStones.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemAeonStonesComponent implements OnInit {

    @Input()
    public item: WornItem;
    @Input()
    public itemStore = false;

    public newAeonStone: Array<AeonStoneSet>;

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _durationsService: DurationsService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return this._characterService.character;
    }

    public availableSlots(): Array<number> {
        const indexes: Array<number> = [];

        for (let index = 0; index < this.item.isWayfinder; index++) {
            indexes.push(index);
        }

        return indexes;
    }

    public inventories(): Array<ItemCollection> {
        if (this.itemStore) {
            return [this._cleanItems()];
        } else {
            return this._character.inventories;
        }
    }

    public inventoryName(inventory: ItemCollection): string {
        return this._inventoryPropertiesService.effectiveName(inventory);
    }

    public initialAeonStones(index: number): Array<AeonStoneSet> {
        const item = this.item;
        //Start with one empty stone to select nothing.
        const allStones: Array<AeonStoneSet> = [{ aeonStone: new WornItem(), inv: null }];

        allStones[0].aeonStone.name = '';

        //Add the current choice, if the item has a stone at that index.
        if (item.aeonStones[index]) {
            allStones.push(this.newAeonStone[index] as AeonStoneSet);
        }

        return allStones;
    }

    public availableAeonStones(inv: ItemCollection): Array<AeonStoneSet> {
        if (this.itemStore) {
            return inv.wornitems.filter(wornItem => wornItem.isAeonStone).map(aeonStone => ({ aeonStone, inv: null }));
        } else {
            return inv.wornitems.filter(wornItem => wornItem.isAeonStone).map(aeonStone => ({ aeonStone, inv }));
        }
    }

    public aeonStoneCooldownText(stone: WornItem): string {
        //If any resonant activity on this aeon Stone has a cooldown, return the lowest of these in a human readable format.
        if (stone.activities?.some(activity => activity.resonant && activity.activeCooldown)) {
            const lowestCooldown =
                Math.min(
                    ...stone.activities
                        .filter(activity => activity.resonant && activity.activeCooldown)
                        .map(activity => activity.activeCooldown),
                );

            return ` (Cooldown: ${ this._durationsService.durationDescription(lowestCooldown) })`;
        } else {
            return '';
        }
    }

    public onSelectAeonStone(index: number): void {
        const item: WornItem = this.item;
        const stone: WornItem = this.newAeonStone[index].aeonStone;
        const inv: ItemCollection = this.newAeonStone[index].inv;

        if (!item.aeonStones[index] || stone !== item.aeonStones[index]) {
            // If there is an Aeon Stone in this slot, return the old stone to the inventory, unless we are in the item store.
            // Then remove it from the item.
            if (item.aeonStones[index]) {
                if (!this.itemStore) {
                    this._removeAeonStone(index);
                }

                item.aeonStones.splice(index, 1);
            }

            //Then add the new Aeon Stone to the item and (unless we are in the item store) remove it from the inventory.
            if (stone.name !== '') {
                //Add a copy of the stone to the item
                const newLength =
                    item.aeonStones.push(
                        stone.clone(this._itemsDataService),
                    );
                const newStone = item.aeonStones[newLength - 1];

                newStone.amount = 1;
                newStone.isSlottedAeonStone = true;

                // If we are not in the item store, remove the inserted Aeon Stone from the inventory,
                // either by decreasing the amount or by dropping the item.
                if (!this.itemStore) {
                    this._characterService.dropInventoryItem(this._character, inv, stone, false, false, false, 1);
                }
            }
        }

        this._prepareChanges(stone);
        this._setAeonStoneNames();
        this._refreshService.processPreparedChanges();
    }

    public hint(stone: WornItem): string {
        if (this.itemStore && stone.price) {
            return `Price ${ this._priceText(stone) }`;
        }
    }

    public ngOnInit(): void {
        this._setAeonStoneNames();
    }

    private _cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

    private _removeAeonStone(index: number): void {
        const character = this._character;
        const item: WornItem = this.item;
        const oldStone: WornItem = item.aeonStones[index];

        oldStone.isSlottedAeonStone = false;
        this._prepareChanges(oldStone);
        //Add the extracted stone back to the inventory.
        this._characterService.grantInventoryItem(
            oldStone,
            { creature: character, inventory: character.inventories[0] },
            { resetRunes: false, changeAfter: false, equipAfter: false },
        );
    }

    private _prepareChanges(stone: WornItem): void {
        this._refreshService.prepareChangesByItem(this._character, stone);
    }

    private _priceText(stone: WornItem): string {
        if (stone.price) {
            return PriceTextFromCopper(stone.price);
        } else {
            return '';
        }
    }

    private _setAeonStoneNames(): void {
        this.newAeonStone =
            (this.item.aeonStones ? [
                (this.item.aeonStones[0] ? { aeonStone: this.item.aeonStones[0], inv: null } : { aeonStone: new WornItem(), inv: null }),
                (this.item.aeonStones[1] ? { aeonStone: this.item.aeonStones[1], inv: null } : { aeonStone: new WornItem(), inv: null }),
            ] : [{ aeonStone: new WornItem(), inv: null }, { aeonStone: new WornItem(), inv: null }]);
        this.newAeonStone.filter(stone => stone.aeonStone.name === 'New Item').forEach(stone => {
            stone.aeonStone.name = '';
        });
    }

}

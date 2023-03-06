import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Talisman } from 'src/app/classes/Talisman';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Equipment } from 'src/app/classes/Equipment';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from 'src/app/classes/WornItem';
import { Character } from 'src/app/classes/Character';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { PriceTextFromCopper } from 'src/libs/shared/util/currencyUtils';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface TalismanOption {
    talisman: Talisman;
    inv?: ItemCollection;
    talismanCordCompatible: boolean;
}

@Component({
    selector: 'app-item-talismans',
    templateUrl: './item-talismans.component.html',
    styleUrls: ['./item-talismans.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemTalismansComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public item!: Equipment;
    @Input()
    public itemStore?: boolean;

    public newTalisman!: Array<TalismanOption>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _inventoryService: InventoryService,
        private readonly _recastService: RecastService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public availableSlots(): Array<number> {
        //Items can have one talisman.
        //Add as many slots as the item has talismans inserted (should be one, but just in case).
        //If none are inserted, add one slot as long as any talismans are available to insert.
        const indexes: Array<number> = [];

        if (this.item.talismans.length) {
            for (let index = 0; index < this.item.talismans.length; index++) {
                indexes.push(index);
            }
        } else if (this.itemStore || this._character.inventories.some(inv => inv.talismans.length)) {
            indexes.push(0);
        }

        return indexes;
    }

    public inventoriesOrCleanItems(): Array<ItemCollection> {
        if (this.itemStore) {
            return [this._cleanItems()];
        } else {
            return this._character.inventories;
        }
    }

    public inventoryName(inv: ItemCollection): string {
        return this._inventoryPropertiesService.effectiveName(inv, this._character);
    }

    public initialTalismans(index: number): Array<TalismanOption> {
        const item = this.item;
        //Start with one empty talisman to select nothing.
        const allTalismans: Array<TalismanOption> = [{ talisman: new Talisman(), inv: undefined, talismanCordCompatible: false }];

        allTalismans[0].talisman.name = '';

        //Add the current choice, if the item has a talisman at that index.
        if (item.talismans[index]) {
            allTalismans.push(
                {
                    ...this.newTalisman[index],
                    talismanCordCompatible: this._isTalismanCompatibleWithTalismanCord(this.newTalisman[index].talisman),
                },
            );
        }

        return allTalismans;
    }

    public availableTalismans(inv: ItemCollection): Array<TalismanOption> {
        const twoDigits = 2;

        return inv.talismans.filter(talisman => talisman.targets.length && talisman.amount)
            .map(talisman => ({
                talisman,
                inv: (this.itemStore ? undefined : inv),
                talismanCordCompatible: this._isTalismanCompatibleWithTalismanCord(talisman),
            }))
            .filter(talisman =>
                talisman.talisman.targets.length &&
                (
                    talisman.talisman.targets.includes(this.item.type) ||
                    (
                        //Exception: The jade bauble is affixed to a melee weapon, which is not a weapon type.
                        this.item instanceof Weapon && this.item.melee && talisman.talisman.targets.includes('melee weapons')
                    ) ||
                    (
                        //Exception: Weapon talismans can be affixed to handwraps of mighty blows.
                        this.item instanceof WornItem && this.item.isHandwrapsOfMightyBlows && talisman.talisman.targets.includes('weapons')
                    ) ||
                    (
                        //Exception: Worn items with the bracers of armor functionality can attach armor talismans.
                        this.item instanceof WornItem && this.item.isBracersOfArmor && talisman.talisman.targets.includes('armors')
                    )
                ),
            )
            .sort((a, b) => SortAlphaNum(
                a.talisman.level.toString().padStart(twoDigits, '0') + a.talisman.name,
                b.talisman.level.toString().padStart(twoDigits, '0') + b.talisman.name,
            ));
    }

    public onSelectTalisman(index: number): void {
        const item: Equipment = this.item;
        const talisman: Talisman = this.newTalisman[index].talisman;
        const inv: ItemCollection | undefined = this.newTalisman[index].inv;

        if (!item.talismans[index] || talisman !== item.talismans[index]) {
            // If there is a Talisman in this slot, return the old one to the inventory,
            // unless we are in the item store. Then remove it from the item.
            if (item.talismans[index]) {
                if (!this.itemStore) {
                    this._removeTalisman(index);
                }

                item.talismans.splice(index, 1);
            }

            //Then add the new Talisman to the item and (unless we are in the item store) remove it from the inventory.
            if (talisman.name !== '') {
                //Add a copy of Talisman to the item
                const newLength = item.talismans.push(talisman.clone(this._recastService.recastOnlyFns));
                const newTalisman = item.talismans[newLength - 1];

                newTalisman.amount = 1;

                // If we are not in the item store, remove the inserted Talisman from the inventory,
                // either by decreasing the amount or by dropping the item.
                if (!this.itemStore && inv) {
                    this._inventoryService.dropInventoryItem(this._character, inv, talisman, false, false, false, 1);
                }
            }
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');

        if (this.item instanceof Weapon) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        }

        if (this.item instanceof Armor || this.item instanceof Shield || this.item instanceof WornItem) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
        }

        this._setTalismanNames();
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, this.item.id);
        this._refreshService.processPreparedChanges();
    }

    public talismanTitle(talisman: Talisman, talismanCordCompatible: boolean): string {
        const parts: Array<string> = [];

        if (this.itemStore && talisman.price) {
            parts.push(`Price ${ this._priceText(talisman) }`);
        }

        if (talismanCordCompatible) {
            parts.push('Compatible with equipped talisman cord');
        }

        return parts.join('; ');
    }

    public ngOnInit(): void {
        this._setTalismanNames();
    }

    private _priceText(talisman: Talisman): string {
        return PriceTextFromCopper(talisman.price);
    }

    private _setTalismanNames(): void {
        this.newTalisman = [];

        if (this.item.talismans.length) {
            this.newTalisman =
                this.item.talismans.map(talisman => ({
                    talisman,
                    inv: undefined,
                    talismanCordCompatible: this._isTalismanCompatibleWithTalismanCord(talisman),
                }));
        } else {
            this.newTalisman = [{ talisman: new Talisman(), inv: undefined, talismanCordCompatible: false }];
        }

        this.newTalisman
            .filter(talisman => talisman.talisman.name === 'New Item')
            .forEach(talisman => {
                talisman.talisman.name = '';
            });
    }

    private _cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

    private _isTalismanCompatibleWithTalismanCord(talisman: Talisman): boolean {
        return this.item.talismanCords
            .some(cord =>
                cord.isCompatibleWithTalisman(talisman),
            );
    }

    private _removeTalisman(index: number): void {
        const character = this._character;
        const oldTalisman = this.item.talismans[index];

        //Add the extracted stone back to the inventory.
        this._inventoryService.grantInventoryItem(
            oldTalisman,
            { creature: character, inventory: character.inventories[0] },
            { resetRunes: false, changeAfter: false, equipAfter: false },
        );
    }

}

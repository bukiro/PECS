/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Oil } from 'src/app/classes/items/oil';
import { Weapon } from 'src/app/classes/items/weapon';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface OilSet {
    oil: Oil;
    inv?: ItemCollection;
}

@Component({
    selector: 'app-item-oils',
    templateUrl: './item-oils.component.html',
    styleUrls: ['./item-oils.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemOilsComponent extends TrackByMixin(BaseClass) {

    @Input()
    public item!: Item;
    @Input()
    public itemStore?: boolean = false;
    public newOil: OilSet = { oil: new Oil() };

    public newPropertyRuneName: Array<string> = ['', '', ''];

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _durationsService: DurationsService,
        private readonly _inventoryService: InventoryService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _recastService: RecastService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public durationDescription$(turns: number): Observable<string> {
        return this._durationsService.durationDescription$(turns);
    }

    public availableOils(): Array<OilSet> {
        const item = this.item;
        const allOils: Array<OilSet> = [{ oil: new Oil() }];

        allOils[0].oil.name = '';

        if (this.itemStore) {
            allOils.push(...this._itemsDataService.cleanItems().oils.filter(oil => oil.targets.length).map(oil => ({ oil })));
        } else {
            this._character.inventories.forEach(inv => {
                allOils.push(...inv.oils.filter(oil => oil.targets.length && oil.amount).map(oil => ({ oil, inv })));
            });
        }

        return allOils.filter(
            (oil: OilSet, index) =>
                index === 0 ||
                (
                    oil.oil.targets.length && (
                        oil.oil.targets.includes(item.type) ||
                        oil.oil.targets.includes('items')
                    ) && (
                        oil.oil.weightLimit
                            ? !parseInt(item.bulk, 10) || (item.bulk && parseInt(item.bulk, 10) <= oil.oil.weightLimit)
                            : true
                    ) && (
                        oil.oil.rangereq && item.isWeapon()
                            ? item[oil.oil.rangereq as keyof Weapon]
                            : true
                    ) && (
                        oil.oil.damagereq
                            ? item instanceof Weapon &&
                            item.dmgType &&
                            (
                                item.dmgType === 'modular' ||
                                oil.oil.damagereq
                                    .split('')
                                    .some(req => item.dmgType.includes(req))
                            )
                            : true
                    )
                ),
        );
    }

    public onSelectOil(): void {
        if (this.newOil.oil.name) {
            const item = this.item;
            const newLength = item.oilsApplied.push(this.newOil.oil.clone(RecastService.recastFns));

            if (this.newOil.inv) {
                this._inventoryService.dropInventoryItem(this._character, this.newOil.inv, this.newOil.oil, false, false, false, 1);
            }

            //Add RuneLore if the oil's Rune Effect includes one
            const newOil = item.oilsApplied[newLength - 1];

            if (newOil.runeEffect && newOil.runeEffect.loreChoices.length) {
                this._characterLoreService.addRuneLore(newOil.runeEffect);
            }

            this.newOil = { oil: new Oil() };
            this.newOil.oil.name = '';
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
            this._refreshService.prepareChangesByItem(this._character, this.item);
            this._refreshService.processPreparedChanges();
        }
    }

    public onRemoveOil(index: number): void {
        //Remove RuneLore if applicable.
        const oil = this.item.oilsApplied[index];

        if (oil.runeEffect && oil.runeEffect.loreChoices.length) {
            this._characterLoreService.removeRuneLore(oil.runeEffect);
        }

        this.item.oilsApplied.splice(index, 1);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareChangesByItem(this._character, this.item);
        this._refreshService.processPreparedChanges();
    }

}

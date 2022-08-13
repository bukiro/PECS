import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { Item } from 'src/app/classes/Item';
import { Oil } from 'src/app/classes/Oil';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { TimeService } from 'src/app/services/time.service';
import { Weapon } from 'src/app/classes/Weapon';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

interface OilSet {
    oil: Oil;
    inv: ItemCollection;
}

@Component({
    selector: 'app-itemOils',
    templateUrl: './itemOils.component.html',
    styleUrls: ['./itemOils.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemOilsComponent {

    @Input()
    public item: Item;
    @Input()
    public itemStore = false;
    public newOil: OilSet = { oil: new Oil(), inv: null };

    public newPropertyRuneName: Array<string> = ['', '', ''];

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemsService: ItemsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _timeService: TimeService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return this._characterService.character;
    }

    public durationDescription(turns: number): string {
        return this._timeService.durationDescription(turns);
    }

    public availableOils(): Array<OilSet> {
        const item = this.item;
        const allOils: Array<OilSet> = [{ oil: new Oil(), inv: null }];

        allOils[0].oil.name = '';

        if (this.itemStore) {
            allOils.push(...this._itemsService.cleanItems().oils.filter(oil => oil.targets.length).map(oil => ({ oil, inv: null })));
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
                        oil.oil.rangereq
                            ? item[oil.oil.rangereq]
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
            const newLength = item.oilsApplied.push(
                Object.assign(
                    new Oil(),
                    JSON.parse(JSON.stringify(this.newOil.oil)),
                ).recast(this._itemsService),
            );

            if (this.newOil.inv) {
                this._characterService.dropInventoryItem(this._character, this.newOil.inv, this.newOil.oil, false, false, false, 1);
            }

            //Add RuneLore if the oil's Rune Effect includes one
            if (item.oilsApplied[newLength - 1].runeEffect && item.oilsApplied[newLength - 1].runeEffect.loreChoices.length) {
                this._characterService.addRuneLore(item.oilsApplied[newLength - 1].runeEffect);
            }

            this.newOil = { oil: new Oil(), inv: null };
            this.newOil.oil.name = '';
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
            this._refreshService.prepareChangesByItem(this._character, this.item);
            this._refreshService.processPreparedChanges();
        }
    }

    public onRemoveOil(index: number): void {
        //Remove RuneLore if applicable.
        if (this.item.oilsApplied[index].runeEffect && this.item.oilsApplied[index].runeEffect.loreChoices.length) {
            this._characterService.removeRuneLore(this.item.oilsApplied[index].runeEffect);
        }

        this.item.oilsApplied.splice(index, 1);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareChangesByItem(this._character, this.item);
        this._refreshService.processPreparedChanges();
    }

}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { Weapon } from 'src/app/classes/Weapon';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

interface PoisonSet {
    poison: AlchemicalPoison;
    inv?: ItemCollection;
}

@Component({
    selector: 'app-item-poisons',
    templateUrl: './item-poisons.component.html',
    styleUrls: ['./item-poisons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemPoisonsComponent {

    @Input()
    public item!: Weapon;
    @Input()
    public itemStore?: boolean;
    public newPoison: PoisonSet = { poison: new AlchemicalPoison() };

    public newPropertyRuneName: Array<string> = ['', '', ''];

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _inventoryService: InventoryService,
        private readonly _recastService: RecastService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return CreatureService.character;
    }

    public availablePoisons(): Array<PoisonSet> {
        const allPoisons: Array<PoisonSet> = [{ poison: new AlchemicalPoison() }];

        allPoisons[0].poison.name = '';

        if (this.itemStore) {
            allPoisons.push(
                ...this._itemsDataService.cleanItems().alchemicalpoisons
                    .filter(poison => poison.traits.includes('Injury'))
                    .map(poison => ({ poison })),
            );
        } else {
            this._character.inventories.forEach(inv => {
                allPoisons.push(
                    ...inv.alchemicalpoisons
                        .filter(poison => poison.traits.includes('Injury'))
                        .map(poison => ({ poison, inv })),
                );
            });
        }

        return allPoisons;
    }

    public onSelectPoison(): void {
        if (this.newPoison.poison.name) {
            const item = this.item;

            item.poisonsApplied.length = 0;
            item.poisonsApplied.push(this.newPoison.poison.clone(this._recastService.recastOnlyFns));

            if (this.newPoison.inv) {
                this._inventoryService.dropInventoryItem(
                    this._character,
                    this.newPoison.inv,
                    this.newPoison.poison,
                    false,
                    false,
                    false,
                    1,
                );
            }

            this.newPoison = { poison: new AlchemicalPoison() };
            this.newPoison.poison.name = '';
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
            this._refreshService.prepareChangesByItem(
                this._character,
                this.item,
            );
            this._refreshService.processPreparedChanges();
        }
    }

    public onRemovePoison(index: number): void {
        this.item.poisonsApplied.splice(index, 1);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareChangesByItem(
            this._character,
            this.item,
        );
        this._refreshService.processPreparedChanges();
    }

}

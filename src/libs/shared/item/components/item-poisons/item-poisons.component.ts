import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Character } from 'src/app/classes/creatures/character/character';
import { AlchemicalPoison } from 'src/app/classes/items/alchemical-poison';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Weapon } from 'src/app/classes/items/weapon';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { FormsModule } from '@angular/forms';

interface PoisonSet {
    poison: AlchemicalPoison;
    inv?: ItemCollection;
}

@Component({
    selector: 'app-item-poisons',
    templateUrl: './item-poisons.component.html',
    styleUrls: ['./item-poisons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
    ],
})
export class ItemPoisonsComponent extends TrackByMixin(BaseClass) {

    @Input()
    public item!: Weapon;
    @Input()
    public itemStore?: boolean;
    public newPoison: PoisonSet = { poison: new AlchemicalPoison() };

    public newPropertyRuneName: Array<string> = ['', '', ''];

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _inventoryService: InventoryService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public availablePoisons(): Array<PoisonSet> {
        const defaultPoison = { poison: new AlchemicalPoison() };

        defaultPoison.poison.name = '';

        const allPoisons: Array<PoisonSet> = [defaultPoison];

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
            item.poisonsApplied.push(this.newPoison.poison.clone(RecastService.recastFns));

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
        }
    }

    public onRemovePoison(index: number): void {
        this.item.poisonsApplied.splice(index, 1);
    }

}

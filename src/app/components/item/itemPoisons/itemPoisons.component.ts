import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { Weapon } from 'src/app/classes/Weapon';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

interface PoisonSet {
    poison: AlchemicalPoison;
    inv: ItemCollection;
}

@Component({
    selector: 'app-itemPoisons',
    templateUrl: './itemPoisons.component.html',
    styleUrls: ['./itemPoisons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemPoisonsComponent {

    @Input()
    public item: Weapon;
    @Input()
    public itemStore = false;
    public newPoison: PoisonSet = { poison: new AlchemicalPoison(), inv: null };

    public newPropertyRuneName: Array<string> = ['', '', ''];

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemsService: ItemsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return this._characterService.character;
    }

    public availablePoisons(): Array<PoisonSet> {
        const allPoisons: Array<PoisonSet> = [{ poison: new AlchemicalPoison(), inv: null }];

        allPoisons[0].poison.name = '';

        if (this.itemStore) {
            allPoisons.push(
                ...this._itemsService.cleanItems().alchemicalpoisons
                    .filter(poison => poison.traits.includes('Injury'))
                    .map(poison => ({ poison, inv: null })),
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
            item.poisonsApplied.push(
                Object.assign(
                    new AlchemicalPoison(),
                    JSON.parse(JSON.stringify(this.newPoison.poison)),
                ).recast(this._itemsService),
            );

            if (this.newPoison.inv) {
                this._characterService.dropInventoryItem(
                    this._character,
                    this.newPoison.inv,
                    this.newPoison.poison,
                    false,
                    false,
                    false,
                    1,
                );
            }

            this.newPoison = { poison: new AlchemicalPoison(), inv: null };
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

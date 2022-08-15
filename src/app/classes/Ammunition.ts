import { Consumable } from 'src/app/classes/Consumable';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class Ammunition extends Consumable {
    //Ammunition should be type "ammunition" to be found in the database
    public readonly type = 'ammunition';
    public activities: Array<ItemActivity> = [];
    public actions = '';
    /**
     * The ammunition group, in order to identify suitable weapons.
     * Same as the weapon type: Arrows, Blowgun Darts, Bolts, Sling Bullets or Any
     */
    public ammunition = '';

    public recast(itemsDataService: ItemsDataService): Ammunition {
        super.recast(itemsDataService);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast());

        return this;
    }

    public clone(itemsDataService: ItemsDataService): Ammunition {
        return Object.assign<Ammunition, Ammunition>(
            new Ammunition(), JSON.parse(JSON.stringify(this)),
        ).recast(itemsDataService);
    }

    public effectiveName(): string {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells[0]?.spells?.length) {
            return `${ this.name } of ${ this.storedSpells[0].spells[0].name }`;
        } else {
            return this.name;
        }
    }
}

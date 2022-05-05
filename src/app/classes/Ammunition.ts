import { Consumable } from 'src/app/classes/Consumable';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';

export class Ammunition extends Consumable {
    //Ammunition should be type "ammunition" to be found in the database
    readonly type = 'ammunition';
    activities: Array<ItemActivity> = [];
    actions = '';
    activationType = '';
    //The ammunition group, in order to identify suitable weapons. Same as the weapon type: Arrows, Blowgun Darts, Bolts, Sling Bullets or Any
    public ammunition = '';
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast());

        return this;
    }
    getName() {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells[0]?.spells?.length) {
            return `${ this.name } of ${ this.storedSpells[0].spells[0].name }`;
        } else {
            return this.name;
        }
    }
}

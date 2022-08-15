import { Consumable } from 'src/app/classes/Consumable';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class Scroll extends Consumable {
    //Scrolls should be type "scrolls" to be found in the database
    public readonly type = 'scrolls';

    public recast(itemsDataService: ItemsDataService): Scroll {
        super.recast(itemsDataService);

        return this;
    }

    public clone(itemsDataService: ItemsDataService): Scroll {
        return Object.assign<Scroll, Scroll>(new Scroll(), JSON.parse(JSON.stringify(this))).recast(itemsDataService);
    }

    public isScroll(): this is Scroll { return true; }

    public effectiveName(): string {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return `${ this.name } of ${ this.storedSpells[0].spells[0].name }`;
        } else {
            return this.name;
        }
    }
}

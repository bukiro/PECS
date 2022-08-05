import { Consumable } from 'src/app/classes/Consumable';
import { ItemsService } from 'src/app/services/items.service';

export class Scroll extends Consumable {
    //Scrolls should be type "scrolls" to be found in the database
    public readonly type = 'scrolls';

    public recast(itemsService: ItemsService): Scroll {
        super.recast(itemsService);

        return this;
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

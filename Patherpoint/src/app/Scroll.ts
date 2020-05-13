import { Consumable } from './Consumable';
import { SpellsService } from './spells.service';

export class Scroll extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Scrolls should be type "scrolls" to be found in the database
    readonly type = "scrolls";
    get_Name() {
        if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return "Scroll of "+this.storedSpells[0].spells[0].name;
        } else {
            return this.name;
        }
    }
}
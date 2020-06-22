import { Consumable } from './Consumable';

export class Scroll extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Scrolls should be type "scrolls" to be found in the database
    readonly type = "scrolls";
    get_Name() {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return this.name+" of "+this.storedSpells[0].spells[0].name;
        } else {
            return this.name;
        }
    }
}
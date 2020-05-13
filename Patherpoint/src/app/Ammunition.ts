import { Consumable } from './Consumable';

export class Ammunition extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Ammunition should be type "ammunition" to be found in the database
    readonly type = "ammunition";
    //The ammunition group, in order to identify suitable weapons. Same as the weapon type: Arrows, Blowgun Darts, Sling Bullets or Any
    public ammunition: string = "";
    get_Name() {
        if (this.displayName) {
            return this.displayName
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return this.name+" of "+this.storedSpells[0].spells[0].name;
        } else {
            return this.name;
        }
    }
}
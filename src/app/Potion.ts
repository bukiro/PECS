import { Consumable } from './Consumable';

export class Potion extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Potions should be type "potions" to be found in the database
    readonly type = "potions";
}
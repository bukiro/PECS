import { Consumable } from './Consumable';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    readonly type = "potions";
}
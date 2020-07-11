import { Consumable } from './Consumable';
import { AlchemicalBomb } from './AlchemicalBomb';

export class OtherConsumableBomb extends AlchemicalBomb {
    public readonly _className: string = this.constructor.name;
    //Other Consumables (Bombs) should be type "otherconsumablesbombs" to be found in the database
    readonly type = "otherconsumablesbombs";
}
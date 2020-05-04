import { Consumable } from './Consumable';

export class OtherConsumable extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Other Consumables should be type "otherconsumables" to be found in the database
    readonly type = "otherconsumables";
}
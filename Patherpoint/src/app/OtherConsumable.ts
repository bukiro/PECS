import { Consumable } from './Consumable';

export class OtherConsumable extends Consumable {
    //Other Consumables should be type "otherconsumables" to be found in the database
    public type: string = "otherconsumables";
}
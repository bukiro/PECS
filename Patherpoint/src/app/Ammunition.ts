import { Consumable } from './Consumable';

export class Ammunition extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Ammunition should be type "ammunition" to be found in the database
    readonly type = "ammunition";
}
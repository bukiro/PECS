import { Consumable } from './Consumable';

export class AlchemicalTool extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Alchemical tools should be type "alchemicaltools" to be found in the database
    readonly type = "alchemicaltools";
}
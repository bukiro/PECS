import { Consumable } from './Consumable';

export class Talisman extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Other Consumables should be type "talismans" to be found in the database
    readonly type = "talismans";
    public requirements: string = "";
    //You can only choose this talisman for an item if its type is in the targets list
    public targets: string[] = [];
    public trigger: string = "";
}
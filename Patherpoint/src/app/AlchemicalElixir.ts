import { Consumable } from './Consumable';

export class AlchemicalElixir extends Consumable {
    //Alchemical Elixirs should be type "alchemicalelixirs" to be found in the database
    readonly type = "alchemicalelixirs";
    //Alchemical Elixirs can have benefits and drawbacks. Describe them here.
    //Will be shown as "Benefit":"..."
    public benefit: string = "";
    //Will be shown as "Drawback":"..."
    public drawback: string = "";
}
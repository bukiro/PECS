import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class AlchemicalElixir extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Alchemical Elixirs should be type "alchemicalelixirs" to be found in the database
    readonly type = "alchemicalelixirs";
    //Alchemical Elixirs can have benefits and drawbacks. Describe them here.
    //Will be shown as "Benefit":"..."
    public benefit: string = "";
    //Will be shown as "Drawback":"..."
    public drawback: string = "";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
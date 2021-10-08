import { Consumable } from './Consumable';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';

export class AlchemicalElixir extends Consumable {
    //Alchemical Elixirs should be type "alchemicalelixirs" to be found in the database
    readonly type = "alchemicalelixirs";
    //Alchemical Elixirs can have benefits and drawbacks. Describe them here.
    //Will be shown as "Benefit":"..."
    public benefit: string = "";
    //Will be shown as "Drawback":"..."
    public drawback: string = "";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class AlchemicalPoison extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Alchemical Poisons should be type "alchemicalpoisons" to be found in the database
    readonly type = "alchemicalpoisons";
    public savingThrow: string = "";
    public maxDuration: number = 0;
    //Alchemical Poisons can have Stages. Describe them here, with the index being the stage number and [0] being the Onset stage.
    public stages: string[] = [];
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
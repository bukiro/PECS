import { Consumable } from './Consumable';
import { TypeService } from './type.service';

export class Potion extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Potions should be type "potions" to be found in the database
    readonly type = "potions";
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
}
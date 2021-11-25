import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { Weapon } from 'src/app/classes/Weapon';

export class AlchemicalBomb extends Weapon {
    //Alchemical bombs should be type "alchemicalbombs" to be found in the database
    public type = "alchemicalbombs";
    //Alchemical bombs are never moddable.
    readonly moddable = false;
    //What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items.
    public readonly weaponBase: string = "Alchemical Bomb";
    public readonly equippable = false;
    get_Name() {
        return this.displayName || this.name;
    }
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        return this;
    }
}
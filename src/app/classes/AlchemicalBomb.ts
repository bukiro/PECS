import { ItemsService } from 'src/app/services/items.service';
import { Weapon } from 'src/app/classes/Weapon';

export class AlchemicalBomb extends Weapon {
    //Alchemical bombs should be type "alchemicalbombs" to be found in the database
    public type = 'alchemicalbombs';
    //Alchemical bombs are never moddable.
    public readonly moddable = false;
    /** Usually "Free", "Reaction", "1", "2" or "3", but can be something special like "1 hour" */
    public actions = '1A';
    /** What needs to be done to activate? Example: "Command", "Manipulate" */
    public activationType = '';
    /** A description of what happens if the bomb hits. */
    public hitEffect = '';
    /** What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items. */
    public readonly weaponBase: string = 'Alchemical Bomb';
    public readonly equippable = false;

    public effectiveName(): string {
        return this.displayName || this.name;
    }

    public recast(itemsService: ItemsService): AlchemicalBomb {
        super.recast(itemsService);

        return this;
    }

    public canStack(): boolean {
        return true;
    }
}

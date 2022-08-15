import { Weapon } from 'src/app/classes/Weapon';
import { ItemsDataService } from '../core/services/data/items-data.service';

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

    public recast(itemsDataService: ItemsDataService): AlchemicalBomb {
        super.recast(itemsDataService);

        return this;
    }

    public clone(itemsDataService: ItemsDataService): AlchemicalBomb {
        return Object.assign<AlchemicalBomb, AlchemicalBomb>(
            new AlchemicalBomb(), JSON.parse(JSON.stringify(this)),
        ).recast(itemsDataService);
    }

    public effectiveName(): string {
        return this.displayName || this.name;
    }

    public canStack(): boolean {
        return true;
    }
}

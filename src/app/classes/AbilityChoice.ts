import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { Character } from 'src/app/classes/Character';

export class AbilityChoice {
    public available = 0;
    //How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost = 0;
    public boosts: Array<AbilityBoost> = [];
    public filter: Array<string> = [];
    public id = '';
    public infoOnly = false;
    public source = '';
    public type: 'Boost' | 'Flaw' = 'Boost';
    public bonus = false;

    public recast(): AbilityChoice {
        return this;
    }

    public clone(): AbilityChoice {
        return Object.assign<AbilityChoice, AbilityChoice>(new AbilityChoice(), JSON.parse(JSON.stringify(this))).recast();
    }

    public maxAvailable(character: Character): number {
        return this.available - (character.baseValues.length ? this.baseValuesLost : 0);
    }
}

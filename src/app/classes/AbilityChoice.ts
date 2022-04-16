import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { Character } from 'src/app/classes/Character';

export class AbilityChoice {
    public available = 0;
    //How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost = 0;
    public boosts: AbilityBoost[] = [];
    public filter: string[] = [];
    public id = '';
    public infoOnly = false;
    public source = '';
    public type: 'Boost' | 'Flaw' = 'Boost';
    public bonus = false;
    maxAvailable(character: Character) {
        return this.available - (character.baseValues.length ? this.baseValuesLost : 0);
    }
    recast() {
        return this;
    }
}

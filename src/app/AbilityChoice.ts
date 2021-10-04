import { AbilityBoost } from './AbilityBoost';
import { Character } from './Character';

export class AbilityChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    //How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost: number = 0;
    public boosts: AbilityBoost[] = [];
    public filter: string[] = [];
    public id: string = "";
    public infoOnly: boolean = false;
    public source: string = "";
    public type: "Boost"|"Flaw" = "Boost";
    public bonus: boolean = false;
    maxAvailable(character: Character) {
        let lost = 0;
        if (character.baseValues.length > 0) {
            lost = this.baseValuesLost
        }
        return this.available - lost;
    }
    recast() {
        return this;
    }
}
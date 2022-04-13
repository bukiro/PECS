import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { Character } from 'src/app/classes/Character';

export class AbilityChoice {
    public available: number = 0;
    //How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost: number = 0;
    public boosts: AbilityBoost[] = [];
    public filter: string[] = [];
    public id: string = "";
    public infoOnly: boolean = false;
    public source: string = "";
    public type: "Boost" | "Flaw" = "Boost";
    public bonus: boolean = false;
    maxAvailable(character: Character) {
        return this.available - (!!character.baseValues.length ? this.baseValuesLost : 0);
    }
    recast() {
        return this;
    }
}

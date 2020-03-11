import { AbilityBoost } from './AbilityBoost';

export class AbilityChoice {
    public available: number = 0;
    public boosts: AbilityBoost[] = [];
    public filter: string[] = [];
    //How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost: number = 0;
    public source: string = "";
    public id: string = "";
}
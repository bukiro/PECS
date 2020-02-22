export interface AbilityChoice {
    available: number;
    boosts: any[];
    filter: string[];
    //How many of the available ability boosts are lost if you rolled your ability scores?
    baseValuesLost: number;
    source: string;
    id: number;
}
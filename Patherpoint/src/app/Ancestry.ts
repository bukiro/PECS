import { AbilityChoice } from './AbilityChoice';
import { ItemGain } from './ItemGain';

export class Ancestry {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public ancestries: string[] = [];
    public baseLanguages: number = 0;
    public gainItems: ItemGain[] = [];
    public heritages: string[] = [];
    public hitPoints: number = 0;
    public languages: string[] = [];
    public name: string = "";
    public recommendedLanguages: string[] = [];
    public senses: string[] = [];
    public size: number = 0;
    public speed: number = 0;
    public traits: string[] = [];
    reassign() {
        //this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), JSON.parse(JSON.stringify(choice))));
    }
}
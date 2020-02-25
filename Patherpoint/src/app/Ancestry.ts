import { AbilityChoice } from './AbilityChoice';

export class Ancestry {
    public name: string = "";
    public traits: string[] = [];
    public ancestries: string[] = [];
    public heritages: string[] = [];
    public hitPoints: number = 0;
    public size: string = "medium";
    public speed: number = 0;
    public abilityChoices: AbilityChoice[] = [];
    public languages: string[] = [];
    public freeLanguages: number = 0;
    public freeLanguages_applied: number = 0;
    public recommendedLanguages: string[] = [];
    public vision: string = "";
    public freeItems = [];
}
import { AbilityBoost } from './AbilityBoost';

export class Ancestry {
    public name: string = "";
    public traits: string[] = [];
    public heritages: string[] = [];
    public hitpoints: number = 0;
    public size: string = "medium";
    public speed: number = 0;
    public abilityBoosts = [];
    public availableAbilityBoosts: AbilityBoost[] = [];
    public languages: string[] = [];
    public freeLanguages: number = 0;
    public freeLanguages_applied: number = 0;
    public recommendedLanguages: string[] = [];
    public vision: string = "";
    public freeItems = [];
}
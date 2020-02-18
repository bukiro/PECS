import { Level } from './Level';
import { Character } from './Character';

export class Ancestry {
    public name: string = "";
    public traits: string[] = [];
    public heritages: string[] = [];
    public hitpoints: number = 0;
    public size: string = "medium";
    public speed: number = 0;
    public abilityChoices: string[] = [];
    public abilityBoosts = [];
    public abilityBoosts_available: number = 0;
    public abilityBoosts_applied: number = 0;
    public languages: string[] = [];
    public freeLanguages: number = 0;
    public freeLanguages_applied: number = 0;
    public recommendedLanguages: string[] = [];
    public vision: string = "";
    public freeItems = [];
}
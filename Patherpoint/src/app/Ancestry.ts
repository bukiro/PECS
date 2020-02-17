import { Level } from './Level';

export class Ancestry {
    public name: string = "";
    public traits: string[] = [];
    public heritages: string[] = [];
    public hitpoints: number = 0;
    public size: string = "medium";
    public speed: number = 0;
    public level: Level = new Level();
    public abilityBoosts = [];
    public abilityBoosts_available: number = 0;
    public abilityBoosts_applied: number = 0;
    public languages: string[] = [];
    public freeLanguages: number = 0;
    public freeLanguages_applied: number = 0;
    public recommendedLanguages: string[] = [];
    public vision: string = "";
    public freeItem: string = "";
    prepare_Export() {
        this.abilityBoosts = this.level.abilityBoosts;
        this.abilityBoosts_available = this.level.abilityBoosts_available;
        this.abilityBoosts_applied = this.level.abilityBoosts_applied;
    }
    on_Import() {
        this.level = new Level(0, this.abilityBoosts, this.abilityBoosts_available, this.abilityBoosts_applied)
    }

}
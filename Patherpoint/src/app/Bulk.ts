import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';

export class Bulk {
    public readonly _className: string = this.constructor.name;
    public $absolutes: Effect[];
    public $currentabsolutes: Effect[];
    public $bonuses: boolean = false;
    public $currentbonuses: boolean = false;
    public $current: { value: number, explain: string } = { value: 0, explain: "" };
    public $encumbered: { value: number, explain: string } = { value: 0, explain: "" };
    public $max: { value: number, explain: string } = { value: 0, explain: "" };
    public $penalties: boolean = false;
    public $currentpenalties: boolean = false;
    calculate(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        this.$absolutes = this.absolutes(creature, effectsService, "Max Bulk");
        this.$currentabsolutes = this.absolutes(creature, effectsService, "Bulk");
        this.$bonuses = this.bonuses(creature, effectsService, "Max Bulk");
        this.$currentbonuses = this.bonuses(creature, effectsService, "Bulk");
        this.$current = this.current(creature, characterService, effectsService);
        this.$encumbered = this.encumbered(creature, characterService, effectsService);
        this.$max = this.max(creature, characterService, effectsService);
        this.$penalties = this.penalties(creature, effectsService, "Max Bulk");
        this.$currentpenalties = this.penalties(creature, effectsService, "Bulk");
    }
    absolutes(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    relatives(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.get_RelativesOnThis(creature, name);
    }
    bonuses(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.show_BonusesOnThis(creature, name);
    }
    penalties(creature: Character | AnimalCompanion, effectsService: EffectsService, name: string) {
        return effectsService.show_PenaltiesOnThis(creature, name);
    }
    current(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        let sum: number = 0;
        let explain: string = "";
        let inventories = creature.inventories;
        inventories.forEach(inventory => {
            //To avoid decimal issues, the bulk is rounded to one decimal.
            let bulk = Math.floor(Math.max(inventory.get_Bulk(false) - inventory.bulkReduction, 0) * 10) / 10;
            sum += bulk;
            explain += "\n" + inventory.get_Name(characterService) + ": " + bulk;
        })
        this.absolutes(creature, effectsService, "Bulk").forEach(effect => {
            sum = parseInt(effect.setValue);
            explain = effect.source + ": " + effect.setValue;
        });
        this.relatives(creature, effectsService, "Bulk").forEach(effect => {
            sum += parseInt(effect.value);
            explain += effect.source + ": " + effect.value;
        });
        sum = Math.max(0, sum);
        //Cut the first newline
        explain = explain.trim();
        return { value: Math.floor(sum), explain: explain };
    }
    encumbered(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        //Gets the basic bulk and adds all effects
        if (characterService.still_loading()) { return this.$encumbered; }
        let result: { value: number, explain: string } = { value: 5, explain: "Base limit: 5" };
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        if (str != 0) {
            result.value += str;
            result.explain += "\nStrength Modifier: " + str;
        }
        this.absolutes(creature, effectsService, "Encumbered Limit").forEach(effect => {
            result.value = parseInt(effect.setValue);
            result.explain = effect.source + ": " + effect.setValue;
        });
        this.relatives(creature, effectsService, "Encumbered Limit").forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += "\n" + effect.source + ": " + effect.value;
        });
        return result;
    }
    max(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        //Gets the basic bulk and adds all effects
        if (characterService.still_loading()) { return this.$max; }
        let result: { value: number, explain: string } = { value: 10, explain: "Base limit: 10" };
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        if (str != 0) {
            result.value += str;
            result.explain += "\nStrength Modifier: " + str;
        }
        this.absolutes(creature, effectsService, "Max Bulk").forEach(effect => {
            result.value = parseInt(effect.setValue);
            result.explain = effect.source + ": " + effect.setValue;
        });
        this.relatives(creature, effectsService, "Max Bulk").forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += "\n" + effect.source + ": " + effect.value;
        });
        return result;
    }
}
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';

export class Bulk {
    public readonly _className: string = this.constructor.name;
    recast() {
        return this;
    }
    calculate(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        let maxabsolutes = this.absolutes(creature, effectsService, "Max Bulk");
        let currentabsolutes = this.absolutes(creature, effectsService, "Bulk");
        let encumberedabsolutes = this.absolutes(creature, effectsService, "Encumbered Limit");

        let result = {
            maxabsolutes: maxabsolutes,
            maxbonuses: this.bonuses(creature, effectsService, "Max Bulk"),
            maxpenalties: this.penalties(creature, effectsService, "Max Bulk"),
            max: this.max(creature, characterService, effectsService, maxabsolutes),
            currentabsolutes: currentabsolutes,
            currentbonuses: this.bonuses(creature, effectsService, "Bulk"),
            currentpenalties: this.penalties(creature, effectsService, "Bulk"),
            current: this.current(creature, characterService, effectsService, currentabsolutes),
            encumberedabsolutes: currentabsolutes,
            encumberedbonuses: this.bonuses(creature, effectsService, "Encumbered Limit"),
            encumberedpenalties: this.penalties(creature, effectsService, "Encumbered Limit"),
            encumbered: this.encumbered(creature, characterService, effectsService, encumberedabsolutes)
        }
        return result;
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
    current(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, absolutes: Effect[] = undefined) {
        let inventories = creature.inventories;
        let result: { value: number, explain: string } = { value: 0, explain: "" };
        if (characterService.still_loading()) { return result; }
        inventories.forEach(inventory => {
            //To avoid decimal issues, the bulk is rounded to one decimal.
            let bulk = Math.floor(Math.max(0, inventory.get_Bulk(false, true)) * 10) / 10;
            result.value += bulk;
            result.explain += "\n" + inventory.get_Name(characterService) + ": " + bulk;
        })
        if (absolutes == undefined) {
            absolutes = this.absolutes(creature, effectsService, "Bulk");
        }
        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue);
            result.explain = effect.source + ": " + effect.setValue;
        });
        this.relatives(creature, effectsService, "Bulk").forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += effect.source + ": " + effect.value;
        });
        result.value = Math.floor(Math.max(0, result.value));
        //Cut the first newline
        result.explain = result.explain.trim();
        return result;
    }
    encumbered(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, absolutes: Effect[] = undefined) {
        //Gets the basic bulk and adds all effects
        let result: { value: number, explain: string } = { value: 5, explain: "Base limit: 5" };
        if (characterService.still_loading()) { return result; }
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        if (str != 0) {
            result.value += str;
            result.explain += "\nStrength Modifier: " + str;
        }
        if (absolutes == undefined) {
            absolutes = this.absolutes(creature, effectsService, "Encumbered Limit");
        }
        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue);
            result.explain = effect.source + ": " + effect.setValue;
        });
        this.relatives(creature, effectsService, "Encumbered Limit").forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += "\n" + effect.source + ": " + effect.value;
        });
        return result;
    }
    max(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, absolutes: Effect[] = undefined) {
        //Gets the basic bulk and adds all effects
        let result: { value: number, explain: string } = { value: 10, explain: "Base limit: 10" };
        if (characterService.still_loading()) { return result; }
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        if (str != 0) {
            result.value += str;
            result.explain += "\nStrength Modifier: " + str;
        }
        if (absolutes == undefined) {
            absolutes = this.absolutes(creature, effectsService, "Max Bulk");
        }
        absolutes.forEach(effect => {
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
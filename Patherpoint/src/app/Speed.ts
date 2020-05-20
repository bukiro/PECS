import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';

export class Speed {
    public readonly _className = this.constructor.name;
    constructor (
        public name: string = ""
    ) {};
    public source: string = "";
    effects(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(creature, this.name);
    }
    absolutes(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_AbsolutesOnThis(creature, this.name);
    }
    bonuses(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(creature, this.name);
    }
    penalties(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(creature, this.name);
    }
    baseValue(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, effectsService: EffectsService) {
    //Gets the basic speed and adds all effects
        if (characterService.still_loading()) { return 0; }
        let sum = 0;
        let explain: string = "";
        //Penalties cannot lower a speed below 5. We need to track if one ever reaches 5, then never let it get lower again.
        let above5 = false;
        //Get the base land speed from the ancestry
        if (creature.type == "Familiar") {
            if (this.name == creature.speeds[1].name) {
                sum = 25;
                explain = "\nBase speed: "+sum;
            }
        } else {
            if (this.name == "Land Speed" && creature.class.ancestry.name) {
                sum = creature.class.ancestry.speed;
                explain = "\n"+creature.class.ancestry.name+" base speed: "+sum;
            }
        }
        //Incredible Movement adds 10 to Land Speed on Level 3 and 5 on every fourth level after, provided you are unarmored.
        if (creature.type == "Character") {
            let character = creature as Character;
            if (this.name == "Land Speed" && character.get_FeatsTaken(1, character.level, "Incredible Movement").length) {
                let equippedArmor = creature.inventories[0].armors.filter(armor => armor.equipped)
                if (equippedArmor.length && equippedArmor[0].get_Prof() == "Unarmored") {
                    let incredibleMovementBonus = 5 + (character.level + 1 - ((character.level + 1) % 4)) / 4 * 5;
                    sum += incredibleMovementBonus;
                    explain += "\nIncredible Movement: "+incredibleMovementBonus;
                }
            }
        }
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        let absolutes = this.absolutes(creature, effectsService).filter(effect => effect.setValue);
        absolutes.forEach(effect => {
            sum = parseInt(effect.setValue)
            explain = effect.source + ": " + effect.setValue;
        });
        this.effects(creature, effectsService).forEach(effect => {
            if (sum > 5) {
                above5 = true
            }
            if (above5) {
                sum = Math.max(sum + parseInt(effect.value), 5);
                explain += "\n"+effect.source+": "+effect.value;
            } else {
                sum += parseInt(effect.value);
                explain += "\n"+effect.source+": "+effect.value;
            }
        });
        explain = explain.trim();
        return [sum, explain];
    }
    value(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, effectsService: EffectsService): [number, string] {
        //If there is a general speed penalty (or bonus), it applies to all speeds. We apply it to the base speed here so we can still
        // copy the base speed for effects (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
        let sum = this.baseValue(creature, characterService, effectsService)[0];
        let explain: string = this.baseValue(creature, characterService, effectsService)[1];
        let above5 = false;
        if (this.name != "Speed") {
            effectsService.get_RelativesOnThis(creature, "Speed").forEach(effect => {
                if (sum > 5) {
                    above5 = true
                }
                if (above5) {
                    sum = Math.max(sum + parseInt(effect.value), 5);
                    explain += "\n"+effect.source+": "+effect.value;
                } else {
                    sum += parseInt(effect.value);
                    explain += "\n"+effect.source+": "+effect.value;
                }
            });
        }
        return [sum, explain];
    }
}
import { EffectsService } from './effects.service';
import { DefenseService } from './defense.service';
import { CharacterService } from './character.service';
import { Effect } from './Effect';
import { AnimalCompanion } from './AnimalCompanion';
import { Character } from './Character';
import { Creature } from './Creature';
import { Shield } from './Shield';
import { ConditionsService } from './conditions.service';
import { ConditionGain } from './ConditionGain';

export class AC {
    public name: string = "AC"
    set_Cover(creature: Creature, cover: number, shield: Shield = null, characterService: CharacterService, conditionsService: ConditionsService) {
        let conditions: ConditionGain[] = conditionsService.get_AppliedConditions(creature, characterService, creature.conditions, true)
            .filter(gain => gain.name == "Cover" && gain.source == "Quick Status");
        let lesserCover = conditions.find(gain => gain.name == "Cover" && gain.choice == "Lesser");
        let standardCover = conditions.find(gain => gain.name == "Cover" && gain.choice == "Standard");
        let greaterCover = conditions.find(gain => gain.name == "Cover" && gain.choice == "Greater");
        let coverChoice: string = "";
        switch (cover) {
            case 0:
                if (shield) {
                    shield.takingCover = false;
                }
                break;
            case 1:
                if (!lesserCover) {
                    coverChoice = "Lesser";
                }
                break;
            case 2:
                if (!standardCover) {
                    coverChoice = "Standard";
                }
                break;
            case 4:
                if (shield) {
                    shield.takingCover = true;
                }
                if (!greaterCover) {
                    coverChoice = "Greater";
                }
                break;
        }
        if (lesserCover && cover != 1) {
            characterService.remove_Condition(creature, lesserCover, false);
        }
        if (standardCover && cover != 2) {
            characterService.remove_Condition(creature, standardCover, false);
        }
        if (greaterCover && cover != 4) {
            characterService.remove_Condition(creature, greaterCover, false);
        }
        if (coverChoice) {
            let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: "Cover", choice: coverChoice, source: "Quick Status", duration: -1, locked: true })
            characterService.add_Condition(creature, newCondition, false);
        }
        characterService.process_ToChange();
    }
    calculate(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        let character = characterService.get_Character();
        let absolutes: Effect[] = this.absolutes(creature, effectsService);
        let relatives: Effect[] = this.relatives(creature, character, effectsService);

        let result = {
            absolutes: absolutes,
            relatives: relatives,
            bonuses: this.bonuses(creature, character, effectsService),
            penalties: this.penalties(creature, character, effectsService),
            value: this.value(creature, characterService, defenseService, effectsService, absolutes, relatives)
        }
        return result;
    }
    get_NamesList() {
        return [
            "AC",
            "All Checks and DCs",
            "Dexterity-based Checks and DCs"
        ]
    }
    absolutes(creature: Creature, effectsService: EffectsService) {
        return effectsService.get_AbsolutesOnThese(creature, this.get_NamesList());
    }
    relatives(creature: Creature, character: Character, effectsService: EffectsService) {
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature.type == "Familiar") {
            let effects = effectsService.get_RelativesOnThese(character, this.get_NamesList()).filter(effect => effect.type != "circumstance" && effect.type != "status")
            effects.push(...effectsService.get_RelativesOnThese(creature, this.get_NamesList()).filter(effect => effect.type == "circumstance" || effect.type == "status"))
        }
        return effectsService.get_RelativesOnThese(creature, this.get_NamesList());
    }
    bonuses(creature: Creature, character: Character, effectsService: EffectsService) {
        //We need to copy show_BonusesOnThese and adapt it because Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature.type == "Familiar") {
            let characterBonuses = effectsService.get_Effects(character.type).bonuses.some(effect =>
                effect.creature == character.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                effect.type != "circumstance" &&
                effect.type != "status" &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
            let familiarBonuses = effectsService.get_Effects(creature.type).bonuses.some(effect =>
                effect.creature == creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type == "circumstance" || effect.type == "status") &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
            return characterBonuses || familiarBonuses;
        } else {
            return effectsService.show_BonusesOnThese(creature, this.get_NamesList());
        }
    }
    penalties(creature: Creature, character: Character, effectsService: EffectsService) {
        //We need to copy show_PenaltiesOnThese and adapt it because Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature.type == "Familiar") {
            let characterPenalties = effectsService.get_Effects(character.type).penalties.some(effect =>
                effect.creature == character.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                effect.type != "circumstance" &&
                effect.type != "status" &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
            let familiarPenalties = effectsService.get_Effects(creature.type).penalties.some(effect =>
                effect.creature == creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type == "circumstance" || effect.type == "status") &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
            return characterPenalties || familiarPenalties;
        } else {
            return effectsService.show_PenaltiesOnThese(creature, this.get_NamesList());
        }
    }
    value(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService, absolutes: Effect[] = undefined, relatives: Effect[] = undefined) {
        if (characterService.still_loading()) { return { result: 0, explain: "" }; }
        //Get the bonus from the worn armor. This includes the basic 10
        let armorBonus: number = 10;
        let explain: string = "DC Basis: 10";
        let armorCreature: AnimalCompanion | Character;
        let character: Character = characterService.get_Character();
        //Familiars get the Character's AC
        if (creature.type == "Familiar") {
            armorCreature = character;
        } else {
            armorCreature = creature as AnimalCompanion | Character;
        }
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (relatives == undefined) {
            relatives = this.relatives(creature, character, effectsService);
        } else {
            //Reassign the effects to unchain them from the calling function.
            relatives = relatives.map(relative => Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(relative))).recast());
        }
        let armorSet = false;
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        if (absolutes == undefined) {
            absolutes = this.absolutes(armorCreature, effectsService)
        } else {
            //Reassign the effects to unchain them from the calling function.
            absolutes = absolutes.map(absolute => Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(absolute))).recast());
        }
        absolutes.forEach(effect => {
            armorSet = true;
            armorBonus = parseInt(effect.setValue)
            explain = effect.source + ": " + effect.setValue;
        });
        let armors = defenseService.get_EquippedArmor(armorCreature);
        if (!armorSet && armors.length > 0) {
            let armor = armors[0];
            let charLevel = characterService.get_Character().level;
            let dex = characterService.get_Abilities("Dexterity")[0].mod(armorCreature, characterService, effectsService).result;
            //Get the profiency with either this armor or its category
            //Familiars have the same AC as the Character before circumstance or status effects.
            let skillLevel = armor.profLevel(armorCreature, characterService);
            let charLevelBonus = 0;
            if (skillLevel) {
                explain += "\nProficiency: " + skillLevel;
                //Add character level if the character is trained or better with either the armor category or the armor itself
                charLevelBonus = charLevel;
                explain += "\nCharacter Level: " + charLevelBonus;
            }
            //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
            let dexcap = armor.get_DexCap();
            effectsService.get_AbsolutesOnThis(creature, "Dexterity Modifier Cap").forEach(effect => {
                dexcap = parseInt(effect.setValue);
                explain += "\n" + effect.source + ": Dexterity modifier cap " + dexcap;
            })
            effectsService.get_RelativesOnThis(creature, "Dexterity Modifier Cap").forEach(effect => {
                dexcap += parseInt(effect.value);
                explain += "\n" + effect.source + ": Dexterity modifier cap " + parseInt(effect.value);
            })
            let dexBonus = (dexcap != -1) ? Math.max(Math.min(dex, dexcap), 0) : dex;
            if (dexBonus) {
                if (dexcap != -1 && dexcap < dex) {
                    explain += "\nDexterity Modifier (capped): " + dexBonus;
                } else {
                    explain += "\nDexterity Modifier: " + dexBonus;
                }
            }
            //Explain the Armor Bonus
            let armorItemBonus = armor.get_ACBonus();
            let shoddy = armor._shoddy;
            if (armorItemBonus || shoddy) {
                explain += "\nArmor Bonus: " + (armorItemBonus + (shoddy ? 2 : 0));
            }
            //As long as Potency is calculated like this, it is cumulative with item effects on AC.
            let potency = armor.get_PotencyRune();
            if (potency) {
                relatives.push(new Effect(creature.type, "item", this.name, potency.toString(), "", false, "", "Potency", false, true, true, 0))
            }
            if (armor.battleforged) {
                relatives.push(new Effect(creature.type, "item", this.name, "+1", "", false, "", "Battleforged", false, true, true, 0))
            }
            //Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
            if (shoddy && characterService.get_Feats("Junk Tinker")[0]?.have(creature, characterService) && armor.crafted) {
                explain += "\nShoddy (canceled by Junk Tinker): -0";
                relatives.push(new Effect(creature.type, "item", this.name, "0", "", false, "", " (canceled by Junk Tinker)", true, true, true, 0))
            } else if (shoddy) {
                relatives.push(new Effect(creature.type, "item", this.name, "-2", "", false, "", "Shoddy", true, true, true, 0))
            }
            //Add up all modifiers and return the AC gained from this armor
            armorBonus += skillLevel + charLevelBonus + armorItemBonus + dexBonus;
        }
        //Sum up the effects
        let effectsSum = 0;
        characterService.effectsService.get_TypeFilteredEffects(relatives, false)
            .forEach(effect => {
                effectsSum += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
        //Add up the armor bonus and all active effects and return the sum
        let result: number = armorBonus + effectsSum;
        return { result: result, explain: explain };
    }
}

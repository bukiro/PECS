import { EffectsService } from 'src/app/services/effects.service';
import { DefenseService } from 'src/app/services/defense.service';
import { CharacterService } from 'src/app/services/character.service';
import { Effect } from 'src/app/classes/Effect';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Shield } from 'src/app/classes/Shield';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Familiar } from './Familiar';

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
        characterService.refreshService.process_ToChange();
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
        if (creature instanceof Familiar) {
            let effects = effectsService.get_RelativesOnThese(character, this.get_NamesList()).filter(effect => effect.type != "circumstance" && effect.type != "status")
            effects.push(...effectsService.get_RelativesOnThese(creature, this.get_NamesList()).filter(effect => effect.type == "circumstance" || effect.type == "status"))
            return effects;
        } else {
            return effectsService.get_RelativesOnThese(creature, this.get_NamesList());
        }
    }
    bonuses(creature: Creature, character: Character, effectsService: EffectsService) {
        //We need to copy show_BonusesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature instanceof Familiar) {
            return effectsService.get_Effects(creature.type).bonuses.some(effect =>
                effect.creature == creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type == "circumstance" || effect.type == "status") &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
        } else {
            return effectsService.show_BonusesOnThese(creature, this.get_NamesList());
        }
    }
    penalties(creature: Creature, character: Character, effectsService: EffectsService) {
        //We need to copy show_PenaltiesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature instanceof Familiar) {
            return effectsService.get_Effects(creature.type).penalties.some(effect =>
                effect.creature == creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type == "circumstance" || effect.type == "status") &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
        } else {
            return effectsService.show_PenaltiesOnThese(creature, this.get_NamesList());
        }
    }
    value(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService, absolutes: Effect[] = undefined, relatives: Effect[] = undefined) {
        if (characterService.still_loading()) { return { result: 0, explain: "" }; }
        //Get the bonus from the worn armor. This includes the basic 10
        let basicBonus: number = 10;
        let explain: string = "DC Basis: 10";
        const character: Character = characterService.get_Character();
        //Familiars calculate their AC based on the character.
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        const armorCreature: AnimalCompanion | Character = creature instanceof Familiar ? character : (creature as AnimalCompanion | Character);
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
            basicBonus = parseInt(effect.setValue)
            explain = effect.source + ": " + effect.setValue;
        });
        const armors = defenseService.get_EquippedArmor(armorCreature);
        if (!armorSet && armors.length > 0) {
            const armor = armors[0];
            const charLevel = characterService.get_Character().level;
            const dex = characterService.get_Abilities("Dexterity")[0].mod(armorCreature, characterService, effectsService).result;
            //Get the profiency with either this armor or its category.
            //Familiars have the same AC as the Character before circumstance or status effects.
            const skillLevel = armor.profLevel(armorCreature, characterService);
            let charLevelBonus = 0;
            if (skillLevel) {
                explain += "\nProficiency: " + skillLevel;
                //Add character level if the character is trained or better with either the armor category or the armor itself
                charLevelBonus = charLevel;
                explain += "\nCharacter Level: " + charLevelBonus;
            }
            //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
            let dexcap = armor.get_DexCap();
            effectsService.get_AbsolutesOnThis(armorCreature, "Dexterity Modifier Cap").forEach(effect => {
                dexcap = parseInt(effect.setValue);
                explain += "\n" + effect.source + ": Dexterity modifier cap " + dexcap;
            })
            effectsService.get_RelativesOnThis(armorCreature, "Dexterity Modifier Cap").forEach(effect => {
                dexcap += parseInt(effect.value);
                explain += "\n" + effect.source + ": Dexterity modifier cap " + parseInt(effect.value);
            })
            const dexBonus = (dexcap != -1) ? Math.max(Math.min(dex, dexcap), 0) : dex;
            if (dexBonus || dex) {
                if (dexcap != -1 && dexcap < dex) {
                    explain += "\nDexterity Modifier (capped): " + dexBonus;
                } else {
                    explain += "\nDexterity Modifier: " + dexBonus;
                }
            }
            //Explain the Armor Bonus
            let armorItemBonus = armor.get_ACBonus();
            if (armorItemBonus) {
                //Potency increases the armor bonus; it does not add a separate bonus on armors.
                const potency = armor.get_PotencyRune();
                if (potency) {
                    armorItemBonus += potency;
                }
                relatives.push(Object.assign(new Effect(armorItemBonus.toString()), { creature: armorCreature.type, type: "item", target: this.name, source: "Armor bonus" + (potency ? " (+" + potency + " Potency)" : ""), apply: true, show: true }))
            }
            if (armor.battleforged) {
                relatives.push(Object.assign(new Effect("+1"), { creature: armorCreature.type, type: "item", target: this.name, source: "Battleforged", apply: true, show: true }))
            }
            //Shoddy items have a -2 item penalty to ac, unless you have the Junk Tinker feat and have crafted the item yourself.
            //This is considered when _shoddy is calculated.
            if (armor._shoddy) {
                relatives.push(Object.assign(new Effect("-2"), { creature: armorCreature.type, type: "item", target: this.name, source: "Shoddy Armor", penalty: true, apply: true, show: true }))
            }
            //Add up all modifiers and return the AC gained from this armor.
            basicBonus += skillLevel + charLevelBonus + dexBonus;
        }
        //Sum up the effects
        let effectsSum = 0;
        characterService.effectsService.get_TypeFilteredEffects(relatives)
            .forEach(effect => {
                effectsSum += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
        //Add up the armor bonus and all active effects and return the sum
        let result: number = basicBonus + effectsSum;
        return { result: result, explain: explain };
    }
}

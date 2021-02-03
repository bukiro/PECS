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
import { Armor } from './Armor';

export class AC {
    public name: string = "AC"
    public $absolutes: (Effect[])[] = [[], [], []];
    public $relatives: (Effect[])[] = [[], [], []];
    public $bonuses: (boolean)[] = [false, false, false];
    public $penalties: (boolean)[] = [false, false, false];
    public $value: { result: number, explain: string }[] = [{ result: 0, explain: "" }, { result: 0, explain: "" }, { result: 0, explain: "" }];
    set_Cover(creature: Creature, cover: number, shield: Shield = null, characterService: CharacterService, conditionsService: ConditionsService) {
        let conditions: ConditionGain[] = conditionsService.get_AppliedConditions(creature, characterService, creature.conditions, true)
            .filter(gain => ["Lesser Cover", "Standard Cover", "Greater Cover"].includes(gain.name) && gain.source == "Defense");
        let lesserCover = conditions.find(gain => gain.name == "Lesser Cover");
        let standardCover = conditions.find(gain => gain.name == "Standard Cover");
        let greaterCover = conditions.find(gain => gain.name == "Greater Cover");
        let coverName: string = "";
        switch (cover) {
            case 0:
                if (shield) {
                    shield.takingCover == false;
                }
                break;
            case 1:
                if (!lesserCover) {
                    coverName = "Lesser Cover";
                }
                break;
            case 2:
                if (!standardCover) {
                    coverName = "Standard Cover";
                }
                break;
            case 4:
                if (shield) {
                    shield.takingCover == true;
                }
                if (!greaterCover) {
                    coverName = "Greater Cover";
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
        if (coverName) {
            let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: coverName, source: "Defense", duration: -1, locked: true })
            characterService.add_Condition(creature, newCondition, false);
        }
        characterService.process_ToChange();
    }
    calculate(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
            case "Familiar":
                index = 2;
                break;
        }
        this.$absolutes[index] = this.absolutes(creature, effectsService);
        this.$relatives[index] = this.relatives(creature, effectsService);
        this.$bonuses[index] = this.bonus(creature, effectsService);
        this.$penalties[index] = this.penalty(creature, effectsService);
        this.$value[index] = this.value(creature, characterService, defenseService, effectsService);
    }
    absolutes(creature: Creature, effectsService: EffectsService) {
        return effectsService.get_AbsolutesOnThese(creature, [
            this.name,
            "All Checks and DCs",
            "Dexterity-based Checks and DCs"
        ]);
    }
    relatives(creature: Creature, effectsService: EffectsService) {
        return effectsService.get_RelativesOnThese(creature, [
            this.name,
            "All Checks and DCs",
            "Dexterity-based Checks and DCs"
        ]);
    }
    bonus(creature: Creature, effectsService: EffectsService) {
        return effectsService.show_BonusesOnThese(creature, [
            this.name,
            "All Checks and DCs",
            "Dexterity-based Checks and DCs"
        ]);
    }
    penalty(creature: Creature, effectsService: EffectsService) {
        return effectsService.show_PenaltiesOnThese(creature, [
            this.name,
            "All Checks and DCs",
            "Dexterity-based Checks and DCs"
        ]);
    }
    value(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService) {
        if (characterService.still_loading()) { return { result: 0, explain: "" }; }
        //Get the bonus from the worn armor. This includes the basic 10
        let armorBonus: number = 10;
        let explain: string = "DC Basis: 10";
        let armorCreature: AnimalCompanion | Character;
        //Familiars get the Character's AC
        if (creature.type == "Familiar") {
            armorCreature = characterService.get_Character();
        } else {
            armorCreature = creature as AnimalCompanion | Character;
        }

        let armorSet = false;
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        this.absolutes(armorCreature, effectsService).forEach(effect => {
            armorSet = true;
            armorBonus = parseInt(effect.setValue)
            explain = effect.source + ": " + effect.setValue;
        });
        let relatives: Effect[] = [];

        let armors = defenseService.get_EquippedArmor(armorCreature);
        if (!armorSet && armors.length > 0) {
            let armor = armors[0];
            let charLevel = characterService.get_Character().level;
            let dex = characterService.get_Abilities("Dexterity")[0].mod(armorCreature, characterService, effectsService).result;
            //Get the profiency with either this armor or its category
            //Familiars have the same AC as the Character before circumstance or status effects.
            let skillLevel = armor.profLevel(creature as AnimalCompanion | Character, characterService);
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
            let shoddy = armor.$shoddy;
            if (armorItemBonus || shoddy) {
                explain += "\nArmor Bonus: " + (armorItemBonus + (shoddy ? 2 : 0));
            }
            //As long as Potency is calculated like this, it is cumulative with item effects on AC.
            let potency = armor.get_PotencyRune();
            if (potency) {
                relatives.push(new Effect(creature.type, "item", this.name, potency.toString(), "", false, "Potency", false, true, true, 0))
            }
            if (armor.battleforged) {
                relatives.push(new Effect(creature.type, "item", this.name, "+1", "", false, "Battleforged", false, true, true, 0))
            }
            //Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
            if (shoddy && characterService.get_Feats("Junk Tinker")[0]?.have(creature, characterService) && armor.crafted) {
                explain += "\nShoddy (canceled by Junk Tinker): -0";
                relatives.push(new Effect(creature.type, "item", this.name, "0", "", false, " (canceled by Junk Tinker)", true, true, true, 0))
            } else if (shoddy) {
                relatives.push(new Effect(creature.type, "item", this.name, "-2", "", false, "Shoddy", true, true, true, 0))
            }

            //Add up all modifiers and return the AC gained from this armor
            armorBonus += skillLevel + charLevelBonus + armorItemBonus + dexBonus;
        }

        //Get all active effects on this and sum them up
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature.type == "Familiar") {
            relatives.push(...this.relatives(armorCreature, effectsService).filter(effect => effect.type != "circumstance" && effect.type != "status"))
            relatives.push(...this.relatives(creature, effectsService).filter(effect => effect.type == "circumstance" || effect.type == "status"))
        } else {
            relatives.push(...this.relatives(creature, effectsService))
        }
        let effectsSum = 0;
        characterService.effectsService.get_TypeFilteredEffects(relatives, false)
        .forEach(effect => {
            effectsSum += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + effect.value;
        });
        let result: number = armorBonus + effectsSum;
        //Add up the armor bonus and all active effects and return the sum
        return { result: result, explain: explain };
    }
}

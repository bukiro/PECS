import { Injectable } from '@angular/core';
import { AbilitiesService } from 'src/app/services/abilities.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { EffectsService } from 'src/app/services/effects.service';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { Speed } from 'src/app/classes/Speed';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { EffectGain } from '../classes/EffectGain';

type FormulaContext = {
    readonly creature: Creature,
    readonly object?: any,
    readonly parentConditionGain?: ConditionGain,
    readonly parentItem?: Item | Material,
    readonly effect?: EffectGain
}
type FormulaOptions = {
    readonly name?: string,
    readonly pretendCharacterLevel?: number
}

@Injectable({
    providedIn: 'root'
})
export class EvaluationService {

    constructor(
        private abilitiesService: AbilitiesService,
        private familiarsService: FamiliarsService
    ) { }

    private get_TestSpeed(name: string): Speed {
        return (new Speed(name));
    }

    public get_ValueFromFormula(formula: string, services: { readonly characterService: CharacterService, readonly effectsService: EffectsService }, context: FormulaContext, options: FormulaOptions = {}): number | string | null {
        context = Object.assign({
            creature: context.creature,
            object: null,
            parentConditionGain: null,
            parentItem: null
        }, context);
        options = Object.assign({
            name: "",
            pretendCharacterLevel: 0
        }, options);
        //This function takes a formula, then evaluates that formula using the variables and functions listed here.
        //Define some values that may be relevant for effect values
        const effectsService = services.effectsService;
        const characterService = services.characterService;
        const abilitiesService = this.abilitiesService;
        const familiarsService = this.familiarsService;
        const Creature: Creature = context.creature;
        const Character: Character = characterService.get_Character();
        const Companion: AnimalCompanion = characterService.get_Companion();
        const Familiar: Familiar = characterService.get_Familiar();
        const object = context.object;
        const effect = context.effect;
        const parentItem = context.parentItem;
        //Using pretendCharacterLevel helps determine what the formula's result would be on a certain character level other than the current.
        const Level: number = options.pretendCharacterLevel || Character.level;
        //Some values specific to conditions for effect values
        let Duration: number = object?.duration || null;
        let Value: number = object?.value || null;
        let Heightened: number = object?.heightened || null;
        let Choice: string = object?.choice || null;
        let SpellCastingAbility: string = object?.spellCastingAbility || null;
        const SpellSource: string = object?.spellSource || null;
        //Hint effects of conditions pass their conditionGain for these values.
        //Conditions pass their own gain as parentConditionGain for effects.
        //Conditions that are caused by conditions also pass the original conditionGain for the evaluation of their activationPrerequisite.
        const parentConditionGain = context.parentConditionGain;
        if (parentConditionGain) {
            if (!Duration) {
                Duration = parentConditionGain.duration;
            }
            if (!Value) {
                Value = parentConditionGain.value;
            }
            if (!Heightened) {
                Heightened = parentConditionGain.heightened;
            }
            if (!Choice) {
                Choice = parentConditionGain.choice;
            }
            if (!SpellCastingAbility) {
                SpellCastingAbility = parentConditionGain.spellCastingAbility;
            }
        }
        //Some Functions for effect values
        function Temporary_HP(source: string = "", sourceId: string = "") {
            if (sourceId) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.sourceId == sourceId).amount;
            } else if (source) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.source == source).amount;
            } else {
                return Creature.health.temporaryHP[0].amount;
            }
        }
        function Current_HP() {
            return Creature.health.currentHP(Creature, characterService, effectsService).result;
        }
        function Max_HP() {
            return Creature.health.maxHP(Creature, characterService, effectsService).result;
        }
        function Ability(name: string) {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0]?.value((Creature as AnimalCompanion | Character), characterService, effectsService).result;
            }
        }
        function Modifier(name: string) {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0]?.mod((Creature as AnimalCompanion | Character), characterService, effectsService).result;
            }
        }
        function BaseSize() {
            return (Creature as AnimalCompanion | Character | Familiar).get_BaseSize();
        }
        function Size(asNumber: boolean = false) {
            return (Creature as AnimalCompanion | Character | Familiar).get_Size(effectsService, { asNumber: asNumber });
        }
        function Skill(name: string) {
            return characterService.get_Skills(Creature, name)[0]?.baseValue((Creature as AnimalCompanion | Character), characterService, abilitiesService, effectsService, Level).result;
        }
        function Skill_Level(name: string) {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.get_Skills(Creature, name)[0]?.level((Creature as AnimalCompanion | Character), characterService, Level);
            }
        }
        //Get_TestSpeed just provides a blank speed, but this dependency doesn't work within the evaluation. We need to use this.get_TestSpeed instead.
        const get_TestSpeed = this.get_TestSpeed;
        function Speed(name: string) {
            return (get_TestSpeed(name))?.value(Creature, characterService, effectsService).result || 0;
        }
        function Has_Condition(name: string) {
            return characterService.get_AppliedConditions(Creature, name, "", true).length
        }
        function Armor() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].armors.find(armor => armor.equipped);
            }
        }
        function Shield() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].shields.find(shield => shield.equipped);
            }
        }
        function Weapons() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].weapons.filter(weapon => weapon.equipped);
            }
        }
        function WornItems() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped());
            }
        }
        function Has_Feat(creature: string, name: string) {
            if (creature == "Familiar") {
                return familiarsService.get_FamiliarAbilities(name).filter(feat => feat.have(Familiar, characterService, Level, false)).length;
            } else if (creature == "Character") {
                return characterService.get_CharacterFeatsTaken(1, Level, name).length;
            } else {
                return 0;
            }
        }
        function Feats_Taken(creature: string) {
            if (creature == "Familiar") {
                return familiarsService.get_FamiliarAbilities().filter(feat => feat.have(Familiar, characterService, Level, false));
            } else if (creature == "Character") {
                return characterService.get_CharacterFeatsTaken(1, Level);
            } else {
                return 0;
            }
        }
        function SpellcastingModifier() {
            if (SpellCastingAbility) {
                return abilitiesService.get_Abilities(SpellCastingAbility)?.[0]?.mod(Character, characterService, effectsService, Level).result || 0
            } else {
                return 0;
            }
        }
        function Has_Heritage(name: string) {
            return characterService.get_Character().class?.heritage?.name.toLowerCase() == name.toLowerCase() ||
                characterService.get_Character().class?.additionalHeritages.find(extraHeritage => extraHeritage.name.toLowerCase() == name.toLowerCase())
        }
        function Deities() {
            return characterService.get_CharacterDeities(Character);
        }
        function Deity() {
            return characterService.get_CharacterDeities(Character)[0];
        }
        //This function is to avoid evaluating a string like "01" as a base-8 number.
        function CleanupLeadingZeroes(text: string) {
            let cleanedText = text;
            while (cleanedText[0] == "0" && cleanedText != "0") {
                cleanedText = cleanedText.substr(1);
            }
            return cleanedText;
        }
        try {
            const result: number | string | null = eval(CleanupLeadingZeroes(formula));
            if (result == null || typeof result == "string" || typeof result == "number") {
                return result;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        };

    }

}
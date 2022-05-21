import { Injectable } from '@angular/core';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature as CreatureModel } from 'src/app/classes/Creature';
import { EffectsService } from 'src/app/services/effects.service';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { Speed as SpeedModel } from 'src/app/classes/Speed';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { EffectGain } from '../classes/EffectGain';
import { Equipment } from '../classes/Equipment';
import { ActivityGain } from '../classes/ActivityGain';
import { Skill as SkillModel } from '../classes/Skill';
import { Armor as ArmorModel } from '../classes/Armor';
import { Shield as ShieldModel } from '../classes/Shield';
import { Weapon } from '../classes/Weapon';
import { WornItem } from '../classes/WornItem';
import { FeatTaken } from '../character-creation/definitions/models/FeatTaken';
import { Deity as DeityModel } from '../classes/Deity';

interface FormulaObject {
    effects: Array<EffectGain>;
    effectiveName?: () => string;
    name?: string;
}
interface FormulaContext {
    readonly creature: CreatureModel;
    readonly object?: FormulaObject | Partial<ConditionGain>;
    readonly parentConditionGain?: ConditionGain;
    readonly parentItem?: Item | Material;
    readonly effect?: EffectGain;
    readonly effectSourceName?: string;
}
interface FormulaOptions {
    readonly name?: string;
    readonly pretendCharacterLevel?: number;
}

@Injectable({
    providedIn: 'root',
})
export class EvaluationService {

    constructor(
        private readonly _abilitiesService: AbilitiesDataService,
        private readonly _familiarsService: FamiliarsService,
    ) { }

    public valueFromFormula(
        formula: string,
        services: { readonly characterService: CharacterService; readonly effectsService: EffectsService },
        context: FormulaContext, options: FormulaOptions = {},
    ): number | string | null {
        context = {
            creature: context.creature,
            object: null,
            parentConditionGain: null,
            parentItem: null, ...context,
        };
        options = {
            name: '',
            pretendCharacterLevel: 0, ...options,
        };

        //This function takes a formula, then evaluates that formula using the variables and functions listed here.
        //Define some values that may be relevant for effect values
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const effectsService = services.effectsService;
        const characterService = services.characterService;
        const abilitiesService = this._abilitiesService;
        const familiarsService = this._familiarsService;
        const Creature = context.creature;
        const Character = characterService.character();
        const Companion = characterService.companion();
        const Familiar = characterService.familiar();
        const object = context.object;
        const effect = context.effect;
        const parentItem = context.parentItem;
        // Using pretendCharacterLevel helps determine what the formula's result
        // would be on a certain character level other than the current.
        const Level: number = options.pretendCharacterLevel || Character.level;
        //Some values specific to conditions for effect values
        let Duration: number = (object as Partial<ConditionGain>)?.duration || null;
        let Value: number = (object as Partial<ConditionGain>)?.value || null;
        let Heightened: number = (object as Partial<ConditionGain>)?.heightened || null;
        let Choice: string = (object as Partial<ConditionGain>)?.choice || null;
        let SpellCastingAbility: string = (object as Partial<ConditionGain>)?.spellCastingAbility || null;
        const SpellSource: string = (object as Partial<ConditionGain>)?.spellSource || null;
        const ItemChoice: string = (parentItem instanceof Equipment) ? parentItem?.choice || null : null;
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
        /* eslint-disable @typescript-eslint/naming-convention */
        const Temporary_HP = (source = '', sourceId = ''): number => {
            if (sourceId) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.sourceId === sourceId).amount;
            } else if (source) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.source === source).amount;
            } else {
                return Creature.health.temporaryHP[0].amount;
            }
        };
        const Current_HP = (): number => (
            Creature.health.currentHP(Creature, characterService, effectsService).result
        );
        const Max_HP = (): number => (
            Creature.health.maxHP(Creature, characterService, effectsService).result
        );
        const Ability = (name: string): number => {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.abilities(name)[0]
                    ?.value(Creature, characterService, effectsService).result;
            }
        };

        const Modifier = (name: string): number => {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.abilities(name)[0]
                    ?.mod(Creature, characterService, effectsService).result;
            }
        };
        const BaseSize = (): number => (
            Creature.baseSize()
        );
        const Size = (asNumber = false): string | number => (
            Creature.effectiveSize(effectsService, { asNumber })
        );
        const Skill = (name: string): number => (
            characterService.skills(Creature, name)[0]
                ?.baseValue(Creature, characterService, abilitiesService, effectsService, Level).result
        );
        const Skill_Level = (name: string): number => {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.skills(Creature, name)[0]
                    ?.level(Creature, characterService, Level);
            }
        };
        const Skills_Of_Type = (name: string): Array<SkillModel> => (
            characterService.skills(Creature, '', { type: name })
        );
        const Has_Speed = (name: string): boolean => (
            //This tests if you have a certain speed, either from your ancestry or from absolute effects.
            // Bonuses and penalties are ignored, since you shouldn't get a bonus to a speed you don't have.
            Creature.speeds.some(speed => speed.name === name) ||
            effectsService.absoluteEffectsOnThis(Creature, name)
                .some(absoluteEffect => !context.effectSourceName || absoluteEffect.source !== context.effectSourceName)
        );
        const Speed = (name: string): number => (
            (this._testSpeed(name))?.value(Creature, characterService, effectsService).result || 0
        );
        const Has_Condition = (name: string): boolean => (
            !!characterService.currentCreatureConditions(Creature, name, '', true).length
        );
        const Owned_Conditions = (name: string): Array<ConditionGain> => (
            characterService.currentCreatureConditions(Creature, name, '', true)
        );
        const Owned_Activities = (name: string): Array<ActivityGain> => (
            characterService.creatureOwnedActivities(Creature).filter(gain => gain.name === name)
        );
        const Armor = (): ArmorModel => {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].armors.find(armor => armor.equipped);
            }
        };
        const Shield = (): ShieldModel => {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].shields.find(shield => shield.equipped);
            }
        };
        const Weapons = (): Array<Weapon> => {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].weapons.filter(weapon => weapon.equipped);
            }
        };
        const WornItems = (): Array<WornItem> => {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped());
            }
        };
        const Has_Feat = (creatureType: string, name: string): number => {
            if (creatureType === 'Familiar') {
                return familiarsService.get_FamiliarAbilities(name)
                    .filter(feat => feat.have({ creature: Familiar }, { characterService }, { charLevel: Level })).length;
            } else if (creatureType === 'Character') {
                return characterService.characterFeatsTaken(1, Level, { featName: name }).length;
            } else {
                return 0;
            }
        };
        const Feats_Taken = (creatureType: string): Array<FeatTaken> => {
            if (creatureType === 'Familiar') {
                return Familiar.abilities.feats
                    .filter(feat =>
                        familiarsService.get_FamiliarAbilities(feat.name)[0]
                            ?.have({ creature: Familiar }, { characterService }, { charLevel: Level }),
                    );
            } else if (creatureType === 'Character') {
                return characterService.characterFeatsTaken(1, Level);
            } else {
                return [];
            }
        };
        const SpellcastingModifier = (): number => {
            if (SpellCastingAbility) {
                return abilitiesService.abilities(SpellCastingAbility)[0]
                    ?.mod(Character, characterService, effectsService, Level).result || 0;
            } else {
                return 0;
            }
        };
        const Has_Heritage = (name: string): boolean => {
            const allHeritages: Array<string> = Character.class?.heritage ?
                [
                    Character.class.heritage.name.toLowerCase(),
                    Character.class.heritage.superType.toLowerCase(),
                ].concat(
                    ...Character.class.additionalHeritages
                        .map(heritage =>
                            [
                                heritage.name.toLowerCase(),
                                heritage.superType.toLowerCase(),
                            ],
                        ),
                ) :
                [];

            return allHeritages.includes(name);
        };
        const Deities = (): Array<DeityModel> => (
            characterService.currentCharacterDeities(Character)
        );
        const Deity = (): DeityModel => (
            characterService.currentCharacterDeities(Character)[0]
        );
        /* eslint-enable @typescript-eslint/no-unused-vars */
        /* eslint-enable @typescript-eslint/naming-convention */
        //This function is to avoid evaluating a string like "01" as a base-8 number.
        const cleanupLeadingZeroes = (text: string): string => {
            let cleanedText = text;

            while (cleanedText[0] === '0' && cleanedText !== '0') {
                cleanedText = cleanedText.substring(1);
            }

            return cleanedText;
        };

        try {
            // eslint-disable-next-line no-eval
            const result: number | string | null = eval(cleanupLeadingZeroes(formula));

            if (result == null || typeof result === 'string' || typeof result === 'number') {
                return result;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }

    }

    private _testSpeed(name: string): SpeedModel {
        return (new SpeedModel(name));
    }

}

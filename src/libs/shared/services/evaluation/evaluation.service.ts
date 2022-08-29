import { Injectable } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature as CreatureModel } from 'src/app/classes/Creature';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { Speed as SpeedModel } from 'src/app/classes/Speed';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { EffectGain } from '../../../../app/classes/EffectGain';
import { Equipment } from '../../../../app/classes/Equipment';
import { ActivityGain } from '../../../../app/classes/ActivityGain';
import { Skill as SkillModel } from '../../../../app/classes/Skill';
import { Armor as ArmorModel } from '../../../../app/classes/Armor';
import { Shield as ShieldModel } from '../../../../app/classes/Shield';
import { Weapon } from '../../../../app/classes/Weapon';
import { WornItem } from '../../../../app/classes/WornItem';
import { FeatTaken } from '../../../../app/character-creation/definitions/models/FeatTaken';
import { Deity as DeityModel } from '../../../../app/classes/Deity';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureSizeName } from 'src/libs/shared/util/creatureUtils';
import { CreaturePropertiesService } from 'src/libs/shared/services/creature-properties/creature-properties.service';
import { SpeedValuesService } from 'src/libs/shared/services/speed-values/speed-values.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';

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
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _healthService: HealthService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creaturePropertiesService: CreaturePropertiesService,
        private readonly _speedValuesService: SpeedValuesService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _skillsDataService: SkillsDataService,
    ) { }

    public valueFromFormula(
        formula: string,
        context: FormulaContext,
        options: FormulaOptions = {},
    ): number | string | null {
        options = {
            name: '',
            pretendCharacterLevel: 0, ...options,
        };

        //This function takes a formula, then evaluates that formula using the variables and functions listed here.
        //Define some values that may be relevant for effect values
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const Creature = context.creature;
        const Character = CreatureService.character;
        const Companion = CreatureService.companion;
        const Familiar = CreatureService.familiar;
        const object = context.object;
        const effect = context.effect;
        const parentItem = context.parentItem;
        // Using pretendCharacterLevel helps determine what the formula's result
        // would be on a certain character level other than the current.
        const Level: number = options.pretendCharacterLevel || Character.level;
        //Some values specific to conditions for effect values
        let Duration: number | undefined = (object as Partial<ConditionGain>)?.duration || undefined;
        let Value: number | undefined = (object as Partial<ConditionGain>)?.value || undefined;
        let Heightened: number | undefined = (object as Partial<ConditionGain>)?.heightened || undefined;
        let Choice: string | undefined = (object as Partial<ConditionGain>)?.choice || undefined;
        let SpellCastingAbility: string | undefined = (object as Partial<ConditionGain>)?.spellCastingAbility || undefined;
        const SpellSource: string | undefined = (object as Partial<ConditionGain>)?.spellSource || undefined;
        const ItemChoice: string | undefined = (parentItem instanceof Equipment) ? parentItem?.choice || undefined : undefined;
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
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.sourceId === sourceId)?.amount || 0;
            } else if (source) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.source === source)?.amount || 0;
            } else {
                return Creature.health.temporaryHP[0].amount;
            }
        };
        const Current_HP = (): number => (
            this._healthService.currentHP(Creature.health, Creature).result
        );
        const Max_HP = (): number => (
            this._healthService.maxHP(Creature).result
        );
        const Ability = (name: string): number => {
            if (Creature === Familiar) {
                return 0;
            } else {
                return this._abilityValuesService.value(name, Creature).result;
            }
        };

        const Modifier = (name: string): number => {
            if (Creature === Familiar) {
                return 0;
            } else {
                return this._abilityValuesService.mod(name, Creature).result;
            }
        };
        const BaseSize = (): number => (
            Creature.baseSize()
        );
        const Size = (asNumber = false): string | number => (
            asNumber
                ? this._creaturePropertiesService.effectiveSize(Creature)
                : CreatureSizeName(this._creaturePropertiesService.effectiveSize(Creature))
        );
        const Skill = (name: string): number => (
            this._skillValuesService.baseValue(name, Creature, Level).result
        );
        const Skill_Level = (name: string): number => {
            if (Creature === Familiar) {
                return 0;
            } else {
                return this._skillValuesService.level(name, Creature, Level);
            }
        };
        const Skills_Of_Type = (name: string): Array<SkillModel> => (
            this._skillsDataService.skills(Creature.customSkills, '', { type: name })
        );
        const Has_Speed = (name: string): boolean => (
            //This tests if you have a certain speed, either from your ancestry or from absolute effects.
            // Bonuses and penalties are ignored, since you shouldn't get a bonus to a speed you don't have.
            Creature.speeds.some(speed => speed.name === name) ||
            this._creatureEffectsService.absoluteEffectsOnThis(Creature, name)
                .some(absoluteEffect => !context.effectSourceName || absoluteEffect.source !== context.effectSourceName)
        );
        const Speed = (name: string): number => (
            this._speedValuesService.value(this._testSpeed(name), Creature).result || 0
        );
        const Has_Condition = (name: string): boolean => (
            !!this._creatureConditionsService.currentCreatureConditions(Creature, { name }, { readonly: true }).length
        );
        const Owned_Conditions = (name: string): Array<ConditionGain> => (
            this._creatureConditionsService.currentCreatureConditions(Creature, { name }, { readonly: true })
        );
        const Owned_Activities = (name: string): Array<ActivityGain> => (
            this._creatureActivitiesService.creatureOwnedActivities(Creature).filter(gain => gain.name === name)
        );
        const Armor = (): ArmorModel | undefined => {
            if (Creature === Familiar) {
                return undefined;
            } else {
                return Creature.inventories[0].armors.find(armor => armor.equipped);
            }
        };
        const Shield = (): ShieldModel | undefined => {
            if (Creature === Familiar) {
                return undefined;
            } else {
                return Creature.inventories[0].shields.find(shield => shield.equipped);
            }
        };
        const Weapons = (): Array<Weapon> | undefined => {
            if (Creature === Familiar) {
                return undefined;
            } else {
                return Creature.inventories[0].weapons.filter(weapon => weapon.equipped);
            }
        };
        const WornItems = (): Array<WornItem> | undefined => {
            if (Creature === Familiar) {
                return undefined;
            } else {
                return Creature.inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped());
            }
        };
        const Has_Feat = (creatureType: string, name: string): number => {
            if (creatureType === 'Familiar') {
                return this._familiarsDataService.familiarAbilities(name)
                    .filter(feat => this._creatureFeatsService.creatureHasFeat(feat, { creature: Familiar }, { charLevel: Level })).length;
            } else if (creatureType === CreatureTypes.Character) {
                return this._characterFeatsService.characterFeatsTaken(1, Level, { featName: name }).length;
            } else {
                return 0;
            }
        };
        const Feats_Taken = (creatureType: string): Array<FeatTaken> => {
            if (creatureType === 'Familiar') {
                return Familiar.abilities.feats
                    .filter(featTaken => {
                        const feat = this._familiarsDataService.familiarAbilities(featTaken.name)[0];

                        return feat && this._creatureFeatsService.creatureHasFeat(feat, { creature: Familiar }, { charLevel: Level });
                    });
            } else if (creatureType === CreatureTypes.Character) {
                return this._characterFeatsService.characterFeatsTaken(1, Level);
            } else {
                return [];
            }
        };
        const SpellcastingModifier = (): number => {
            if (SpellCastingAbility) {
                return this._abilityValuesService.mod(SpellCastingAbility, Character, Level).result;
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
            this._characterDeitiesService.currentCharacterDeities()
        );
        const Deity = (): DeityModel => (
            this._characterDeitiesService.currentCharacterDeities()[0]
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
            const result: number | string | null | undefined = eval(cleanupLeadingZeroes(formula));

            if (typeof result === 'string' || typeof result === 'number') {
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

import { Injectable } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature as CreatureModel } from 'src/app/classes/creatures/creature';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Item } from 'src/app/classes/items/item';
import { Material } from 'src/app/classes/items/material';
import { Speed as SpeedModel } from 'src/app/classes/creatures/speed';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { Skill as SkillModel } from 'src/app/classes/skills/skill';
import { Armor as ArmorModel } from 'src/app/classes/items/armor';
import { Shield as ShieldModel } from 'src/app/classes/items/shield';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { Deity as DeityModel } from 'src/app/classes/deities/deity';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { creatureSizeName } from 'src/libs/shared/util/creature-utils';
import { CreaturePropertiesService } from 'src/libs/shared/services/creature-properties/creature-properties.service';
import { SpeedValuesService } from 'src/libs/shared/services/speed-values/speed-values.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { SkillsDataService } from '../data/skills-data.service';
import { FeatTaken } from '../../definitions/models/feat-taken';
import { Observable, combineLatest, map, of } from 'rxjs';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Equipment } from 'src/app/classes/items/equipment';
import { emptySafeCombineLatest } from '../../util/observable-utils';

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

    //TODO: Turn this into an async function that doesn't use eval. Something like the complex feat requirements system.
    /**
     * Evaluate formulas from json strings that are used for effects and condition prerequisites.
     * These formulas are written out javascript functions that use specific values and functions defined here.
     * The formulas must always result in a number, string or null, and can't be async.
     */
    // eslint-disable-next-line complexity
    public valueFromFormula$(
        formula: string,
        context: FormulaContext,
        options: FormulaOptions = {},
    ): Observable<number | string | null> {
        options = {
            name: '',
            pretendCharacterLevel: 0, ...options,
        };

        const hasFeat$ = (creatureType: string, name: string): Observable<boolean> => {
            if (creatureType === CreatureTypes.Familiar) {
                return this._creatureFeatsService.creatureHasFeat$(name, { creature: Familiar }, { charLevel: Level })
                    .pipe(
                        map(amount => !!amount),
                    );
            } else if (creatureType === CreatureTypes.Character) {
                return this._characterFeatsService.characterHasFeatAtLevel$(name, Level, { allowCountAs: true });
            } else {
                return of(false);
            }
        };

        const featsTaken$ = (creatureType: string): Observable<Array<FeatTaken>> => {
            if (creatureType === 'Familiar') {
                return of(Familiar.abilities.feats);
            } else if (creatureType === CreatureTypes.Character) {
                return this._characterFeatsService.characterFeatsTaken$(1, Level);
            } else {
                return of([]);
            }
        };

        // While this still uses eval, it can't be reactive. As a workaround, we need to prepare the results beforehand.
        const ownedActivitiesRegex = /Owned_Activities\('(.+?)'\)/gm;
        let shouldPrepareActivities = false;
        const hasFeatRegex = /Has_Feat\('(.+?),[ ]*(.+?)'\)/gm;
        const hasFeatNames: Array<{ creature: string; featName: string }> = [];
        const featsTakenRegex = /Feats_Taken\('(.+?)'\)/gm;
        const featsTakenCreatures: Array<string> = [];
        const speedRegex = /Speed\('(.+?)'\)/gm;
        const speedNames: Array<string> = [];
        const skillValueRegex = /Skill\('(.+?)'\)/gm;
        const skillValueNames: Array<string> = [];
        const skillLevelRegex = /Skill_Level\('(.+?)'\)/gm;
        const skillLevelNames: Array<string> = [];
        const abilityValueRegex = /Ability\('(.+?)'\)/gm;
        const abilityValueNames: Array<string> = [];
        const abilityModRegex = /Modifier\('(.+?)'\)/gm;
        const abilityModNames: Array<string> = [];
        const deityRegex = /Deity\(\)/gm;
        let shouldPrepareDeity = false;
        const deitiesRegex = /Deity\(\)/gm;
        let shouldPrepareDeities = false;
        const sizeRegex = /Size\(\)/gm;
        let shouldPrepareSize = false;
        const SpellcastingModifierRegex = /SpellcastingModifier\(\)/gm;
        let shouldPrepareSpellcastingModifier = false;

        ownedActivitiesRegex.exec(formula)?.forEach(() => {
            shouldPrepareActivities = true;
        });

        hasFeatRegex.exec(formula)?.forEach(match => {
            hasFeatNames.push({ creature: match[1], featName: match[1 + 1] });
        });

        featsTakenRegex.exec(formula)?.forEach(match => {
            featsTakenCreatures.push(match[1]);
        });

        speedRegex.exec(formula)?.forEach(match => {
            speedNames.push(match[1]);
        });

        skillValueRegex.exec(formula)?.forEach(match => {
            skillValueNames.push(match[1]);
        });

        skillLevelRegex.exec(formula)?.forEach(match => {
            skillLevelNames.push(match[1]);
        });

        abilityValueRegex.exec(formula)?.forEach(match => {
            abilityValueNames.push(match[1]);
        });

        abilityModRegex.exec(formula)?.forEach(match => {
            abilityModNames.push(match[1]);
        });

        SpellcastingModifierRegex.exec(formula)?.forEach(() => {
            shouldPrepareSpellcastingModifier = true;
        });

        deityRegex.exec(formula)?.forEach(() => {
            shouldPrepareDeity = true;
        });

        deitiesRegex.exec(formula)?.forEach(() => {
            shouldPrepareDeities = true;
        });

        sizeRegex.exec(formula)?.forEach(() => {
            shouldPrepareSize = true;
        });

        //Define some values that may be relevant for effect values
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const Creature = context.creature;
        const Character = CreatureService.character;
        const Companion = CreatureService.character.class.animalCompanion;
        const Familiar = CreatureService.character.class.familiar;
        // Using pretendCharacterLevel helps determine what the formula's result
        // would be on a certain character level other than the current.
        const Level: number = options.pretendCharacterLevel || Character.level;

        const object = context.object;
        const effect = context.effect;
        const parentItem = context.parentItem;
        //Some values specific to conditions for effect values
        let Duration: number | undefined = (object as Partial<ConditionGain>)?.duration || undefined;
        let Value: number | undefined = (object as Partial<ConditionGain>)?.value || undefined;
        let Heightened: number | undefined = (object as Partial<ConditionGain>)?.heightened || undefined;
        let Choice: string | undefined = (object as Partial<ConditionGain>)?.choice || undefined;
        let SpellCastingAbility: string | undefined = (object as Partial<ConditionGain>)?.spellCastingAbility || undefined;
        const SpellSource: string | undefined = (object as Partial<ConditionGain>)?.spellSource || undefined;
        const ItemChoice: string | undefined = (parentItem instanceof Equipment) ? parentItem?.choice || undefined : undefined;
        // Hint effects of conditions pass their conditionGain for these values.
        // Conditions pass their own gain as parentConditionGain for effects.
        // Conditions that are caused by conditions also pass the original conditionGain
        // for the evaluation of their activationPrerequisite.
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

        return combineLatest([
            this._healthService.currentHP$(Creature),
            this._healthService.maxHP$(Creature),
            shouldPrepareActivities
                ? this._creatureActivitiesService.creatureOwnedActivities$(Creature)
                : of([]),
            emptySafeCombineLatest(
                hasFeatNames
                    .map(requiredFeat => hasFeat$(requiredFeat.creature, requiredFeat.featName)
                        .pipe(
                            map(hasFeat => hasFeat ? requiredFeat : { creature: '', featName: '' }),
                        )),
            ),
            emptySafeCombineLatest(
                speedNames
                    .map(speedName =>
                        //This tests if you have a certain speed, either from your ancestry or from absolute effects.
                        // Bonuses and penalties are ignored, since you shouldn't get a bonus to a speed you don't have.
                        Creature.speeds.some(speed => speed.name === speedName)
                            ? of(speedName)
                            : this._creatureEffectsService.absoluteEffectsOnThis$(Creature, speedName)
                                .pipe(
                                    map(effects => effects.some(absoluteEffect =>
                                        !context.effectSourceName
                                        || absoluteEffect.source !== context.effectSourceName,
                                    )),
                                    map(hasSpeed => hasSpeed ? speedName : ''),
                                ),
                    ),

            ),
            emptySafeCombineLatest(
                speedNames
                    .map(speedName =>
                        this._speedValuesService.value$(this._testSpeed(speedName), Creature)
                            .pipe(
                                map(speed => ({ name: speedName, value: speed.result })),
                            ),
                    ),

            ),
            emptySafeCombineLatest(
                featsTakenCreatures
                    .map(creature => featsTaken$(creature)
                        .pipe(
                            map(feats => ({ creature, feats })),
                        ),
                    ),
            ),
            emptySafeCombineLatest(
                skillValueNames
                    .map(skillName =>
                        // Skill value comparisons use the base value, i.e. before effects.
                        // This prevents an effect from flipflopping if it changes the skill value and therefore its own value,
                        // and it seems closer to the intention - that is, I think that
                        // "Athletics modifier of x, unless your own Athletics modifier is higher"
                        // probably refers to the modifier before at least circumstance and status effects.
                        //TODO: item effects should probably still apply? But then we need to guard against flipflopping effects.
                        this._skillValuesService.baseValue$(skillName, Creature, Level)
                            .pipe(
                                map(value => ({ skill: skillName, value })),
                            ),
                    ),
            ),
            emptySafeCombineLatest(
                skillLevelNames
                    .map(skillName => (Creature === Familiar)
                        ? of({ skill: skillName, value: 0 })
                        : this._skillValuesService.level$(skillName, Creature, Level)
                            .pipe(
                                map(value => ({ skill: skillName, value })),
                            ),
                    ),
            ),
            emptySafeCombineLatest(
                abilityValueNames
                    .map(abilityName => (Creature === Familiar)
                        ? of({ ability: abilityName, value: { result: 0 } })
                        : this._abilityValuesService.value$(abilityName, Creature, Level)
                            .pipe(
                                map(value => ({ ability: abilityName, value })),
                            ),
                    ),
            ),
            emptySafeCombineLatest(
                abilityModNames
                    .map(abilityName => (Creature === Familiar)
                        ? of({ ability: abilityName, value: { result: 0 } })
                        : this._abilityValuesService.mod$(abilityName, Creature, Level)
                            .pipe(
                                map(value => ({ ability: abilityName, value })),
                            ),
                    ),
            ),
            shouldPrepareDeity
                ? this._characterDeitiesService.mainCharacterDeity$
                : of(null),
            shouldPrepareDeities
                ? this._characterDeitiesService.currentCharacterDeities$(Level)
                : of([]),
            shouldPrepareSize
                ? this._creaturePropertiesService.effectiveSize$(Creature)
                : of(0),
            (shouldPrepareSpellcastingModifier && SpellCastingAbility)
                ? this._abilityValuesService.mod$(SpellCastingAbility, Character, Level)
                : of({ result: 0 }),
        ])
            .pipe(
                map(([
                    currentHP,
                    maxHP,
                    ownedActivities,
                    takenFeatNames,
                    availableSpeedNames,
                    speedValues,
                    featsTaken,
                    skillValues,
                    skillLevels,
                    abilityValues,
                    abilityMods,
                    deity,
                    deities,
                    size,
                    spellcastingModifier,
                ]) => {
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
                    const Current_HP = (): number => currentHP.result;
                    const Max_HP = (): number => maxHP.result;
                    const Ability = (name: string): number =>
                        abilityValues.find(abilityValue => abilityValue.ability === name)?.value.result ?? 0;
                    const Modifier = (name: string): number =>
                        abilityMods.find(abilityMod => abilityMod.ability === name)?.value.result ?? 0;
                    const BaseSize = (): number => (
                        Creature.baseSize()
                    );
                    const Size = (asNumber = false): string | number => (
                        asNumber
                            ? size
                            : creatureSizeName(size)
                    );
                    const Skill = (name: string): number =>
                        skillValues.find(skillValue => skillValue.skill === name)?.value.result ?? 0;
                    const Skill_Level = (name: string): number =>
                        skillLevels.find(skillLevel => skillLevel.skill === name)?.value ?? 0;
                    const Skills_Of_Type = (name: string): Array<SkillModel> => (
                        this._skillsDataService.skills(Creature.customSkills, '', { type: name })
                    );
                    const Has_Speed = (name: string): boolean => availableSpeedNames.includes(name);
                    const Speed = (name: string): number => speedValues.find(speedValue => speedValue.name === name)?.value ?? 0;
                    const Has_Condition = (name: string): boolean => (
                        !!this._creatureConditionsService.currentCreatureConditions(Creature, { name }, { readonly: true }).length
                    );
                    const Owned_Conditions = (name: string): Array<ConditionGain> => (
                        this._creatureConditionsService.currentCreatureConditions(Creature, { name }, { readonly: true })
                    );
                    const Owned_Activities = (name: string): Array<ActivityGain | ItemActivity> =>
                        ownedActivities.filter(gain => gain.name === name);
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
                    const Has_Feat = (creatureType: string, name: string): boolean =>
                        takenFeatNames.some(taken => taken.creature === creatureType && taken.featName === name);
                    const Feats_Taken = (creatureType: string): Array<FeatTaken> =>
                        featsTaken.find(taken => taken.creature === creatureType)?.feats ?? [];
                    const SpellcastingModifier = (): number => spellcastingModifier.result;
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
                    const Deities = (): Array<DeityModel> => deities;
                    const Deity = (): DeityModel => deity ?? new DeityModel();
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
                }),
            );

    }

    private _testSpeed(name: string): SpeedModel {
        return (new SpeedModel(name));
    }

}

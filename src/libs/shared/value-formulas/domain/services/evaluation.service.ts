/* eslint-disable complexity */
import { computed, Injectable, signal, Signal } from '@angular/core';
import { map, of, combineLatest } from 'rxjs';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { ItemActivity } from 'src/libs/shared/activities/util/models/item-activity';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { emptySafeCombineLatest } from 'src/libs/shared/common/util/utils/observable-utils';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { filterConditions } from 'src/libs/shared/conditions/util/utils/condition-filter-utils';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { CharacterDeitiesService } from 'src/libs/shared/deities/domain/services/character-deities.service';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { FeatGain } from 'src/libs/shared/feats/util/models/feat-gain';
import { Equipment } from 'src/libs/shared/items/util/models/equipment';
import { Item } from 'src/libs/shared/items/util/models/item';
import { Material } from 'src/libs/shared/items/util/models/material';
import { Weapon } from 'src/libs/shared/items/util/models/weapon';
import { WornItem } from 'src/libs/shared/items/util/models/worn-item';
import { Creature as CreatureModel } from 'src/libs/shared/creatures/util/models/creature';
import { Speed as SpeedModel } from 'src/libs/shared/speed/util/models/speed';
import { SkillsDataService } from 'src/libs/shared/skills/domain/services/skills-data.service';

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
        private readonly _skillsDataService: SkillsDataService,
        private readonly _spellsTakenService: SpellsTakenService,
    ) { }

    //TODO: Turn this into an async function that doesn't use eval. Something like the complex feat requirements system.
    /**
     * Evaluate formulas from json strings that are used for effects and condition prerequisites.
     * These formulas are written out javascript functions that use specific values and functions defined here.
     * The formulas must always result in a number, string or null, and can't be async.
     */
    public valueFromFormula$$(
        formula: string,
        context: FormulaContext,
        options: FormulaOptions = {},
    ): Signal<number | string | null> {
        options = {
            name: '',
            pretendCharacterLevel: 0, ...options,
        };

        // While this still uses eval, it can't be reactive. As a workaround, we need to prepare the results beforehand.
        const ownedActivitiesRegex = /Owned_Activities\('(.+?)'\)/gm;
        let shouldPrepareActivities = false;
        const hasConditionRegex = /Has_Condition\('(.+?)'\)/gm;
        const ownedConditionsRegex = /Owned_Conditions\('(.+?)'\)/gm;
        let shouldPrepareConditions = false;
        const hasFeatRegex = /Has_Feat\('(.+?),[ ]*(.+?)'\)/gm;
        const hasFeatNames: Array<{ creature?: string; featName?: string }> = [];
        const featsTakenRegex = /Feats_Taken\('(.+?)'\)/gm;
        const featsTakenCreatures: Array<string | undefined> = [];
        const speedRegex = /Speed\('(.+?)'\)/gm;
        const speedNames: Array<string | undefined> = [];
        const skillValueRegex = /Skill\('(.+?)'\)/gm;
        const skillValueNames: Array<string | undefined> = [];
        const skillLevelRegex = /Skill_Level\('(.+?)'\)/gm;
        const skillLevelNames: Array<string | undefined> = [];
        const abilityValueRegex = /Ability\('(.+?)'\)/gm;
        const abilityValueNames: Array<string | undefined> = [];
        const abilityModRegex = /Modifier\('(.+?)'\)/gm;
        const abilityModNames: Array<string | undefined> = [];
        const deityRegex = /Deity\(\)/gm;
        let shouldPrepareDeity = false;
        const deitiesRegex = /Deity\(\)/gm;
        let shouldPrepareDeities = false;
        const sizeRegex = /Size\(\)/gm;
        let shouldPrepareSize = false;
        const spellcastingModifierRegex = /SpellcastingModifier\(\)/gm;
        let shouldPrepareSpellcastingModifier = false;

        ownedActivitiesRegex.exec(formula)?.forEach(() => {
            shouldPrepareActivities = true;
        });

        hasConditionRegex.exec(formula)?.forEach(() => {
            shouldPrepareConditions = true;
        });

        ownedConditionsRegex.exec(formula)?.forEach(() => {
            shouldPrepareConditions = true;
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

        spellcastingModifierRegex.exec(formula)?.forEach(() => {
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

        return computed(() => {

            const hasFeat$$ = (creatureType: string, name: string): Signal<boolean> => {
                if (creatureType === CreatureTypes.Familiar) {
                    return computed(() =>
                        !!this._creatureFeatsService.creatureHasFeat$$(name, { creature: Familiar }, { charLevel: Level })(),
                    );
                } else if (creatureType === CreatureTypes.Character) {
                    return this._characterFeatsService.characterHasFeatAtLevel$$(name, Level, { allowCountAs: true });
                } else {
                    return signal(false).asReadonly();
                }
            };

            const featsTaken$$ = (creatureType: string): Signal<Array<FeatGain>> => {
                if (creatureType === 'Familiar') {
                    return Familiar.abilities.feats;
                } else if (creatureType === CreatureTypes.Character) {
                    return this._characterFeatsService.characterFeatsTaken$$(1, Level);
                } else {
                    return signal([]).asReadonly();
                }
            };

            //Define some values that may be relevant for effect values
            /* eslint-disable @typescript-eslint/no-unused-vars */
            const Creature = context.creature;
            const Character = CreatureService.character$$();
            const Companion = CreatureService.animalCompanion$$();
            const Familiar = CreatureService.familiar$$();
            // Using pretendCharacterLevel helps determine what the formula's result
            // would be on a certain character level other than the current.
            const Level: number = options.pretendCharacterLevel || Character.level();

            const object = context.object;
            const effect = context.effect;
            const parentItem = context.parentItem;
            //Some values specific to conditions for effect values
            let Duration: number | undefined = (object as Partial<ConditionGain>)?.duration?.() || undefined;
            let Value: number | undefined = (object as Partial<ConditionGain>)?.value?.() || undefined;
            let Heightened: number | undefined = (object as Partial<ConditionGain>)?.heightened || undefined;
            let Choice: string | undefined = (object as Partial<ConditionGain>)?.choice?.() || undefined;
            let SpellCastingAbility: string | undefined = (object as Partial<ConditionGain>)?.spellCastingAbility || undefined;
            const SpellSource: string | undefined = (object as Partial<ConditionGain>)?.spellSource || undefined;
            const ItemChoice: string | undefined = (parentItem instanceof Equipment) && parentItem?.choice?.() || undefined;
            // Hint effects of conditions pass their conditionGain for these values.
            // Conditions pass their own gain as parentConditionGain for effects.
            // Conditions that are caused by conditions also pass the original conditionGain
            // for the evaluation of their activationPrerequisite.
            const parentConditionGain = context.parentConditionGain;

            if (parentConditionGain) {
                if (!Duration) {
                    Duration = parentConditionGain.duration();
                }

                if (!Value) {
                    Value = parentConditionGain.value();
                }

                if (!Heightened) {
                    Heightened = parentConditionGain.heightened;
                }

                if (!Choice) {
                    Choice = parentConditionGain.choice();
                }

                if (!SpellCastingAbility) {
                    SpellCastingAbility = parentConditionGain.spellCastingAbility;
                }
            }

            return combineLatest([
                this._healthService.currentHP$$(Creature),
                this._healthService.maxHP$$(Creature),
                shouldPrepareActivities
                    ? this._creatureActivitiesService.creatureOwnedActivities$(Creature)
                    : of([]),
                shouldPrepareConditions
                    ? this._appliedCreatureConditionsService.appliedConditions$$(Creature)
                    : of([]),
                this._characterFeatsService.characterFeatsAtLevel$(Level),
                emptySafeCombineLatest(
                    hasFeatNames
                        .filter((requiredFeat): requiredFeat is { creature: string; featName: string } =>
                            !!requiredFeat.creature && !!requiredFeat.featName,
                        )
                        .map(requiredFeat => hasFeat$$(requiredFeat.creature, requiredFeat.featName)
                            .pipe(
                                map(hasFeat => hasFeat ? requiredFeat : { creature: '', featName: '' }),
                            )),
                ),
                emptySafeCombineLatest(
                    speedNames
                        .filter(isDefined)
                        .map(speedName =>
                            //This tests if you have a certain speed, either from your ancestry or from absolute effects.
                            // Bonuses and penalties are ignored, since you shouldn't get a bonus to a speed you don't have.
                            Creature.speeds.some(speed => speed.name === speedName)
                                ? of(speedName)
                                : this._creatureEffectsService.absoluteEffectsOnThis$$(Creature, speedName)
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
                        .filter(isDefined)
                        .map(speedName =>
                            this._speedValuesService.value$(this._testSpeed(speedName), Creature)
                                .pipe(
                                    map(speed => ({ name: speedName, value: speed.result })),
                                ),
                        ),

                ),
                emptySafeCombineLatest(
                    featsTakenCreatures
                        .filter(isDefined)
                        .map(creature => featsTaken$$(creature)
                            .pipe(
                                map(feats => ({ creature, feats })),
                            ),
                        ),
                ),
                emptySafeCombineLatest(
                    skillValueNames
                        .filter(isDefined)
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
                        .filter(isDefined)
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
                        .filter(isDefined)
                        .map(abilityName => (Creature === Familiar)
                            ? of({ ability: abilityName, value: { result: 0 } })
                            : this._abilityValuesService.value$$(abilityName, Creature, Level)
                                .pipe(
                                    map(value => ({ ability: abilityName, value })),
                                ),
                        ),
                ),
                emptySafeCombineLatest(
                    abilityModNames
                        .filter(isDefined)
                        .map(abilityName => (Creature === Familiar)
                            ? of({ ability: abilityName, value: { result: 0 } })
                            : this._abilityValuesService.mod$$(abilityName, Creature, Level)
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
                    ? this._abilityValuesService.mod$$(SpellCastingAbility, Character, Level)
                    : of({ result: 0 }),
                this._spellsTakenService.takenSpells$(0, Level),
            ])
                .pipe(
                    map(([
                        currentHP,
                        maxHP,
                        ownedActivities,
                        ownedConditions,
                        takenFeats,
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
                        takenSpells,
                    ]) => {
                        //Some Functions for effect values
                        /* eslint-disable @typescript-eslint/naming-convention */
                        const Temporary_HP = (source = '', sourceId = ''): number => {
                            if (sourceId) {
                                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.sourceId === sourceId)?.amount || 0;
                            } else if (source) {
                                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.source === source)?.amount || 0;
                            } else {
                                return Creature.health.mainTemporaryHP.amount;
                            }
                        };
                        const Current_HP = (): number => currentHP.result;
                        const Max_HP = (): number => maxHP.result;
                        const Ability = (name: string): number =>
                            abilityValues.find(abilityValue => abilityValue.ability === name)?.value.result ?? 0;
                        const Modifier = (name: string): number =>
                            abilityMods.find(abilityMod => abilityMod.ability === name)?.value.result ?? 0;
                        const BaseSize = (): number => (
                            Creature.baseSize$$()
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
                        // TODO: Implement `excludeTemporary`
                        const Speed = (name: string, excludeTemporary): number => speedValues.find(speedValue => speedValue.name === name)?.value ?? 0;
                        const Has_Condition = (
                            name: string,
                            { withChoices }: { withChoices?: Array<string> } = {},
                        ): boolean => (
                            !!filterConditions(ownedConditions.map(({ gain }) => gain), { name, choices: withChoices }).length
                        );
                        const Owned_Conditions = (name: string): Array<ConditionGain> => (
                            filterConditions(ownedConditions.map(({ gain }) => gain), { name })
                        );
                        const Owned_Activities = (name: string): Array<ActivityGain | ItemActivity> =>
                            ownedActivities.filter(gain => gain.name === name);
                        const Armor = (): ArmorModel | undefined => {
                            if (Creature === Familiar) {
                                return undefined;
                            } else {
                                return Creature.mainInventory.armors.find(armor => armor.equipped);
                            }
                        };
                        const Shield = (): ShieldModel | undefined => {
                            if (Creature === Familiar) {
                                return undefined;
                            } else {
                                return Creature.mainInventory.shields.find(shield => shield.equipped);
                            }
                        };
                        const Weapons = (): Array<Weapon> | undefined => {
                            if (Creature === Familiar) {
                                return undefined;
                            } else {
                                return Creature.mainInventory.weapons.filter(weapon => weapon.equipped);
                            }
                        };
                        const WornItems = (): Array<WornItem> | undefined => {
                            if (Creature === Familiar) {
                                return undefined;
                            } else {
                                return Creature.mainInventory.wornitems.filter(wornItem => wornItem.investedOrEquipped());
                            }
                        };
                        const Has_Feat = (creatureType: string, name: string): boolean =>
                            takenFeatNames.some(taken => taken.creature === creatureType && taken.featName === name);
                        const Feats_Taken = (creatureType: string): Array<FeatGain> =>
                            featsTaken.find(taken => taken.creature === creatureType)?.feats ?? [];
                        const Archetype_Feat_Count = (archetype: string): number =>
                            takenFeats
                                .filter(feat => feat.archetype === archetype)
                                .length;
                        const SpellcastingModifier = (): number => spellcastingModifier.result;
                        const Has_Spell_Prepared = (name: string, source?: string): boolean =>
                            takenSpells
                                .filter(({ gain }) =>
                                    matchStringFilter({ value: gain.name, match: name })
                                    && matchStringFilter({ value: gain.source, match: source }),
                                )
                                .some(spell => spell.gain.prepared);
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


        });
    }

    private _testSpeed(name: string): SpeedModel {
        return (new SpeedModel(name));
    }

}

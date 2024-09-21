/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { switchMap, of, Observable, combineLatest, map, distinctUntilChanged, tap } from 'rxjs';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { ConditionEffectsCollection } from 'src/app/classes/conditions/condition-effects-collection';
import { AnimalCompanionSpecialization } from 'src/app/classes/creatures/animal-companion/animal-companion-specialization';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect, AbsoluteEffect } from 'src/app/classes/effects/effect';
import { Trait } from 'src/app/classes/hints/trait';
import { Armor } from 'src/app/classes/items/armor';
import { Equipment } from 'src/app/classes/items/equipment';
import { Rune } from 'src/app/classes/items/rune';
import { Shield } from 'src/app/classes/items/shield';
import { BonusTypes } from 'src/libs/shared/definitions/bonus-types';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { isEqualSerializableArrayWithoutId, isEqualSerializableArray } from 'src/libs/shared/util/compare-utils';
import { resilientTitleFromLevel } from 'src/libs/shared/util/rune-utils';
import { HintEffectsObject } from '../../definitions/interfaces/hint-effects-object';
import { AlwaysShowingEffectNames, AlwaysShowingWildcardEffectNames } from '../../definitions/showing-effects-lists';
import { CreatureEffectsGenerationService } from '../creature-effects-generation/creature-effects-generation.service';
import { ItemEffectsGenerationService } from '../item-effects-generation/item-effects-generation.service';
import { ObjectEffectsGenerationService } from '../object-effects-generation/object-effects-generation.service';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { flattenArrayLists } from 'src/libs/shared/util/array-utils';

@Injectable({
    providedIn: 'root',
})
export class EffectsGenerationService {

    private _initialized = false;

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creatureEffectsGenerationService: CreatureEffectsGenerationService,
        private readonly _itemEffectsGenerationService: ItemEffectsGenerationService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _objectEffectsGenerationService: ObjectEffectsGenerationService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public initialize(): void {
        if (this._initialized) { return; }

        this._initialized = true;

        CreatureService.character$
            .pipe(
                switchMap(creature => this._generateCreatureEffects$(creature)),
            )
            .subscribe();

        this._creatureAvailabilityService.companionIfAvailable$()
            .pipe(
                switchMap(creature => creature ? this._generateCreatureEffects$(creature) : of(undefined)),
            )
            .subscribe();

        this._creatureAvailabilityService.familiarIfAvailable$()
            .pipe(
                switchMap(creature => creature ? this._generateCreatureEffects$(creature) : of(undefined)),
            )
            .subscribe();
    }

    private _effectsFromOtherCreatures$(creature: Creature): Observable<Array<Effect>> {
        return emptySafeCombineLatest(
            Object.values(CreatureTypes)
                .filter(creatureType => creatureType !== creature.type)
                .map(otherCreatureType =>
                    this._creatureEffectsService.allCreatureEffects$(otherCreatureType),
                ),
        )
            .pipe(
                map(otherCreatureEffectLists =>
                    flattenArrayLists(otherCreatureEffectLists)
                        .filter(effect => effect.creature === creature.id),
                ),
                distinctUntilChanged(isEqualSerializableArrayWithoutId),
            );
    }

    private _collectTraitEffectHints$(
        creature: Creature,
    ): Observable<Array<HintEffectsObject>> {
        return emptySafeCombineLatest(
            this._traitsDataService.traits()
                .filter(trait => trait.hints.length)
                .map(trait => trait.itemsWithThisTrait$(creature)
                    .pipe(
                        distinctUntilChanged(isEqualSerializableArray),
                        map(itemsWithTrait =>
                            itemsWithTrait.length
                                ? trait
                                : null,
                        ),
                    ),
                ),
        )
            .pipe(
                map(traits => traits.filter((trait): trait is Trait => !!trait)),
                map(traits =>
                    traits.map(trait => trait.hints.map(hint => ({ hint, objectName: trait.name }))),
                ),
                map(hintSetLists =>
                    flattenArrayLists(hintSetLists),
                ),
            );
    }

    private _generateObjectEffects$(creature: Creature): Observable<Array<Effect>> {
        return combineLatest([
            // Collect the creature's feats/abilities/specializations and their hints.
            this._creatureEffectsGenerationService.creatureEffectsGenerationObjects$(creature),
            // Collect inventory items and their hints, if the item is equipped and invested as needed.
            this._itemEffectsGenerationService.collectEffectItems$(creature),
            // Collect active conditions and their hints.
            this._creatureConditionsService.collectEffectConditions$(creature),
            // Collect hints of active activities.
            this._creatureActivitiesService.collectActivityEffectHints$(creature),
            //Collect hints of Traits that are on currently equipped items.
            this._collectTraitEffectHints$(creature),
        ])
            .pipe(
                switchMap(([creatureObjects, effectItems, effectConditions, activeActivitiesHintSets, traitEffectHintSets]) => {
                    // Collect objects, conditions and objects' hints to generate effects from.
                    // Hint effects will be handled separately at first.

                    const feats: Array<Feat | AnimalCompanionSpecialization> = creatureObjects.feats;
                    const hintSets = new Array<HintEffectsObject>()
                        .concat(
                            creatureObjects.hintSets,
                            effectItems.hintSets,
                            traitEffectHintSets,
                            effectConditions.hintSets,
                            activeActivitiesHintSets,
                        );
                    const objects: Array<Equipment | Rune | Specialization> = effectItems.objects;
                    const conditions: Array<ConditionEffectsCollection> = effectConditions.conditions;

                    return combineLatest([
                        // Create object effects from the creature.
                        this._objectEffectsGenerationService.effectsFromEffectObject$(creature, { creature }),
                        // Create object effects from abilities and items
                        emptySafeCombineLatest(
                            objects
                                .filter(object => object.effects.length)
                                .map(object =>
                                    this._objectEffectsGenerationService.effectsFromEffectObject$(
                                        object,
                                        { creature },
                                    ),
                                ),
                        ),
                        // Create object effects from from conditions.
                        emptySafeCombineLatest(
                            conditions
                                .filter(object => object.effects.length)
                                .map(conditionEffectsObject =>
                                    this._objectEffectsGenerationService.effectsFromEffectObject$(
                                        conditionEffectsObject,
                                        { creature, parentConditionGain: conditionEffectsObject },
                                    ),
                                ),
                        ),
                        // Create object effects from creature feats/abilities.
                        emptySafeCombineLatest(
                            feats
                                .filter(object => object.effects?.length)
                                .map(object => this._objectEffectsGenerationService.effectsFromEffectObject$(object, { creature })),
                        ),
                        // Create object effects from active hints.
                        emptySafeCombineLatest(
                            hintSets
                                .filter(hintSet =>
                                    hintSet.hint.anyActive &&
                                    hintSet.hint.effects?.length,
                                )
                                .map(hintSet =>
                                    this._objectEffectsGenerationService.effectsFromEffectObject$(
                                        hintSet.hint,
                                        { creature, parentItem: hintSet.parentItem, parentConditionGain: hintSet.parentConditionGain },
                                        { name: `conditional, ${ hintSet.objectName }` },
                                    ),
                                ),
                        ),
                    ])
                        .pipe(
                            map(([creatureEffects, objectEffectLists, conditionEffectLists, featEffectLists, hintEffectLists]) => ({
                                creatureEffects,
                                objectEffects: new Array<Effect>()
                                    .concat(
                                        ...objectEffectLists,
                                        ...conditionEffectLists,
                                    ),
                                featEffects: new Array<Effect>()
                                    .concat(
                                        ...featEffectLists,
                                    ),
                                hintEffects: new Array<Effect>()
                                    .concat(
                                        ...hintEffectLists,
                                    ),
                            })),
                            map(({ creatureEffects, objectEffects, featEffects, hintEffects }) => {
                                // All effects from the creature should be SHOWN.
                                creatureEffects.forEach(effect => {
                                    effect.displayed = true;
                                });

                                // All effects from feats should be HIDDEN.
                                featEffects.forEach(effect => {
                                    effect.displayed = false;
                                });

                                // All effects from hints should be SHOWN.
                                hintEffects.forEach(effect => {
                                    effect.displayed = true;
                                });

                                return objectEffects
                                    .concat(creatureEffects)
                                    .concat(featEffects)
                                    .concat(hintEffects);
                            }),
                        );
                }),
            );
    }

    private _generateArmorEffects$(
        armor: Armor,
        context: { readonly creature: Creature },
        options: { readonly ignoreArmorPenalties: boolean; readonly ignoreArmorSpeedPenalties: boolean },
    ): Observable<Array<Effect>> {
        return combineLatest([
            armor.effectiveTraits$,
            armor.effectiveProficiencyWithoutEffects$(),
            this._abilityValuesService
                .value$('Strength', context.creature),
            armor.effectiveSkillPenalty$(),
            armor.effectiveStrengthRequirement$(),
            armor.effectiveResilient$(),
            armor.effectiveName$(),
        ])
            .pipe(
                map(([armorTraits, proficiency, strength, skillPenalty, strengthRequirement, resilient, name]) => {
                    const itemEffects: Array<Effect> = [];

                    const addEffect = (
                        addOptions: {
                            type: BonusTypes;
                            target: string;
                            value: string;
                            source: string;
                            applied?: boolean;
                        },
                    ): void => {
                        itemEffects.push(Effect.from({
                            creature: context.creature.id,
                            type: addOptions.type,
                            target: addOptions.target,
                            value: addOptions.value,
                            setValue: '',
                            toggled: false,
                            title: '',
                            source: addOptions.source,
                            applied: addOptions.applied,
                        }));
                    };

                    //For Saving Throws, add any resilient runes on the equipped armor.
                    const shouldApplyResilientRune = (
                        resilient > 0 &&
                        !armor.broken
                    );

                    if (shouldApplyResilientRune) {
                        addEffect({
                            type: BonusTypes.Item, target: 'Saving Throws', value: `+${ resilient }`,
                            source: resilientTitleFromLevel(resilient),
                        });
                    }

                    //Add broken penalty if the armor is broken.
                    if (armor.broken) {
                        let brokenPenalty = '';

                        switch (proficiency) {
                            case 'Light Armor':
                                brokenPenalty = '-1';
                                break;
                            case 'Medium Armor':
                                brokenPenalty = '-2';
                                break;
                            case 'Heavy Armor':
                                brokenPenalty = '-3';
                                break;
                            default: break;
                        }

                        if (brokenPenalty) {
                            addEffect({ type: BonusTypes.Untyped, target: 'AC', value: brokenPenalty, source: 'Broken Armor' });
                        }
                    }

                    //Add skill and speed penalties from armor strength requirements and certain traits.
                    if (!options.ignoreArmorPenalties) {
                        //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
                        const strengthValue = strength.result;
                        const skillPenaltyString = skillPenalty.toString();
                        const speedPenalty = armor.effectiveSpeedPenalty();
                        const speedPenaltyString = speedPenalty.toString();

                        if (!(strengthValue >= strengthRequirement)) {
                            if (skillPenalty) {
                                //You are not strong enough to act freely in this armor.
                                //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                                //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                                //We also add a note to the source for clarity.
                                if (armorTraits.includes('Flexible')) {
                                    addEffect({
                                        type: BonusTypes.Item, target: 'Acrobatics', value: skillPenaltyString,
                                        source: `${ name }(cancelled by Flexible)`, applied: false,
                                    });
                                    addEffect({
                                        type: BonusTypes.Item, target: 'Athletics', value: skillPenaltyString,
                                        source: `${ name }(cancelled by Flexible)`, applied: false,
                                    });
                                } else {
                                    addEffect({
                                        type: BonusTypes.Item, target: 'Acrobatics', value: skillPenaltyString,
                                        source: name,
                                    });
                                    addEffect({
                                        type: BonusTypes.Item, target: 'Athletics', value: skillPenaltyString,
                                        source: name,
                                    });
                                }

                                //These two always apply unless you are strong enough.
                                addEffect({
                                    type: BonusTypes.Item, target: 'Stealth', value: skillPenaltyString,
                                    source: name,
                                });
                                addEffect({
                                    type: BonusTypes.Item, target: 'Thievery', value: skillPenaltyString,
                                    source: name,
                                });
                            }

                            if (speedPenalty && !options.ignoreArmorSpeedPenalties) {
                                //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                                addEffect({
                                    type: BonusTypes.Untyped, target: 'Speed', value: speedPenaltyString,
                                    source: name,
                                });
                            }
                        } else {
                            if (skillPenalty) {
                                //If you ARE strong enough, we push some not applying effects so you can feel good about that.
                                addEffect({
                                    type: BonusTypes.Item, target: 'Acrobatics', value: skillPenaltyString,
                                    source: `${ name } (cancelled by Strength)`, applied: false,
                                });
                                addEffect({
                                    type: BonusTypes.Item, target: 'Athletics', value: skillPenaltyString,
                                    source: `${ name } (cancelled by Strength)`, applied: false,
                                });
                                addEffect({
                                    type: BonusTypes.Item, target: 'Thievery', value: skillPenaltyString,
                                    source: `${ name } (cancelled by Strength)`, applied: false,
                                });

                                // UNLESS the item is also Noisy, in which case you do get the stealth penalty
                                // because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                                if (armorTraits.includes('Noisy')) {
                                    addEffect({
                                        type: BonusTypes.Item, target: 'Stealth', value: skillPenaltyString,
                                        source: `${ name } (Noisy)`,
                                    });
                                } else {
                                    addEffect({
                                        type: BonusTypes.Item, target: 'Stealth', value: skillPenaltyString,
                                        source: `${ name } (cancelled by Strength)`, applied: false,
                                    });
                                }
                            }

                            if (speedPenalty && !options.ignoreArmorSpeedPenalties) {
                                // You are strong enough to ignore the speed penalty,
                                // but if the armor is particularly heavy, your penalty is only lessened.
                                const speedPenaltyReduction = 5;

                                if (speedPenalty < -speedPenaltyReduction) {
                                    // In this case we push both a lessened effect,
                                    // so you can feel at least a little good about yourself.
                                    addEffect({
                                        type: BonusTypes.Untyped, target: 'Speed', value: (speedPenalty + speedPenaltyReduction).toString(),
                                        source: `${ name } (lessened by Strength)`, applied: true,
                                    });
                                } else {
                                    // If you are strong enough and the armor only gave -5ft penalty,
                                    // you get a fully avoided effect to gaze at.
                                    addEffect({
                                        type: BonusTypes.Untyped, target: 'Speed', value: speedPenaltyString,
                                        source: `${ name } (cancelled by Strength)`, applied: false,
                                    });
                                }
                            }
                        }
                    }

                    return itemEffects;
                }),
            );
    }

    private _generateShieldEffects$(
        shield: Shield,
        context: { readonly creature: Creature },
    ): Observable<Array<Effect>> {
        return combineLatest([
            shield.effectiveACBonus$(),
            shield.effectiveShoddy$,
            context.creature.isCharacter()
                ? this._characterFeatsService.characterHasFeatAtLevel$('Reflexive Shield')
                : of(false),
            shield.effectiveName$(),
        ])
            .pipe(
                map(([effectiveACBonus, effectiveShoddy, hasReflexiveShield, name]) => {
                    //Get shield bonuses from raised shields
                    //If a shield is raised, add its circumstance bonus to AC with a + in front, but subtract 2 if it's shoddy.
                    const itemEffects: Array<Effect> = [];

                    const addEffect = (
                        addOptions: {
                            type: BonusTypes;
                            target: string;
                            value: string;
                            source: string;
                        }): void => {
                        itemEffects.push(
                            Effect.from({
                                value: addOptions.value,
                                creature: context.creature.id,
                                type: addOptions.type,
                                target: addOptions.target,
                                source: addOptions.source,
                            }),
                        );
                    };

                    const doesShieldBonusApply = (
                        shield.raised &&
                        !shield.broken
                    );

                    if (doesShieldBonusApply) {
                        if (effectiveACBonus) {
                            addEffect({
                                type: BonusTypes.Circumstance, target: 'AC', value: `+${ effectiveACBonus }`,
                                source: name,
                            });

                            if (effectiveShoddy) {
                                addEffect({ type: BonusTypes.Item, target: 'AC', value: '-2', source: 'Shoddy Shield' });
                            }
                        }

                        //Reflexive Shield adds the same bonus to your reflex save. Only a Character can have it.
                        if (hasReflexiveShield) {
                            addEffect({
                                type: BonusTypes.Circumstance, target: 'Reflex', value: `+${ effectiveACBonus }`,
                                source: 'Reflexive Shield',
                            });
                        }
                    }

                    if (shield.speedpenalty) {
                        //Shields don't have a strength requirement for speed penalties. In this case, the penalty just always applies.
                        addEffect({
                            type: BonusTypes.Untyped, target: 'Speed', value: shield.speedpenalty.toString(),
                            source: name,
                        });
                    }

                    return itemEffects;
                }),
            );
    }

    private _generateCalculatedItemEffects$(
        creature: Creature,
        options: { readonly ignoreArmorPenalties: boolean; readonly ignoreArmorSpeedPenalties: boolean },
    ): Observable<Array<Effect>> {
        return combineLatest([
            creature.mainInventory.equippedArmors$
                .pipe(
                    switchMap(armors => emptySafeCombineLatest(
                        armors
                            .map(armor => this._generateArmorEffects$(armor, { creature }, options)),
                    )),
                ),
            creature.mainInventory.equippedShields$
                .pipe(
                    switchMap(shields => emptySafeCombineLatest(
                        shields
                            .map(shield => this._generateShieldEffects$(shield, { creature })),
                    )),
                ),
        ])
            .pipe(
                map(([armorEffectLists, shieldEffectLists]) =>
                    new Array<Effect>()
                        .concat(
                            ...armorEffectLists,
                            ...shieldEffectLists,
                        ),
                ),
            );
    }

    private _applyUnburdenedIron$(effects: Array<Effect>): Observable<Array<Effect>> {
        return this._characterFeatsService.characterHasFeatAtLevel$('Unburdened Iron')
            .pipe(
                map(hasUnburdenedIron => {
                    //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
                    const lessenSpeedPenaltyEffect = (effect: Effect): void => {
                        const speedPenaltyReduction = 5;

                        effect.value = (effect.valueNumerical + speedPenaltyReduction).toString();

                        if (!effect.valueNumerical) {
                            effect.applied = false;
                            effect.source = `${ effect.source } (Cancelled by Unburdened Iron)`;
                        } else {
                            effect.source = `${ effect.source } (Lessened by Unburdened Iron)`;
                        }
                    };

                    if (hasUnburdenedIron) {
                        let hasReducedOnePenalty = false;

                        //Try global speed penalties first (this is more beneficial to the character).
                        effects.forEach(effect => {
                            if (!hasReducedOnePenalty && effect.target === 'Speed' && effect.penalty && !effect.toggled) {
                                hasReducedOnePenalty = true;
                                lessenSpeedPenaltyEffect(effect);
                            }
                        });
                        effects.forEach(effect => {
                            if (!hasReducedOnePenalty && effect.target === 'Land Speed' && effect.penalty && !effect.toggled) {
                                hasReducedOnePenalty = true;
                                lessenSpeedPenaltyEffect(effect);
                            }
                        });
                    }

                    return effects;
                }),
            );
    }

    private _setEffectsIgnored(effects: Array<Effect>, context: { readonly creature: Creature }): Array<Effect> {
        //Reset ignoring all effects before processing ignored effects.
        effects.forEach(effect => {
            effect.ignored = false;
        });

        const isEffectIgnored = (effect: Effect): boolean => (
            context.creature.ignoredEffects
                .some(ignoredEffect =>
                    ignoredEffect.creature === effect.creature &&
                    ignoredEffect.target === effect.target &&
                    ignoredEffect.source === effect.source,
                )
        );

        //Ignore all effects that match the creature's ignoredEffects.
        effects.filter(effect => isEffectIgnored(effect)).forEach(effect => {
            effect.ignored = true;
        });
        //Cleanup the creature's ignoredEffects and delete each that doesn't match an existing effect.
        context.creature.ignoredEffects = context.creature.ignoredEffects
            .filter(ignoredEffect =>
                effects.some(effect =>
                    ignoredEffect.creature === effect.creature &&
                    ignoredEffect.target === effect.target &&
                    ignoredEffect.source === effect.source,
                ),
            );

        return effects;
    }

    private _setEffectsApplied(effects: Array<Effect>, context: { readonly creature: Creature }): Array<Effect> {
        //Toggle effects are always applied.
        effects.filter(effect => effect.toggled).forEach(effect => {
            effect.applied = true;
        });

        //On Familiars, item bonuses never apply.
        if (context.creature.isFamiliar()) {
            effects.filter(effect => !effect.penalty && effect.type === 'item').forEach(effect => {
                effect.applied = false;
            });
        }

        //Now we need to go over all the effects.
        // If one target is affected by two bonuses of the same type, only the bigger one is applied.
        // The same goes for penalties, unless they are untyped.

        const targets: Array<string> = [];

        //Collect all targets of effects, but each only once
        effects.forEach(effect => {
            if (!targets.includes(effect.target)) {
                targets.push(effect.target);
            }
        });
        targets.forEach(target => {
            let hasAbsolutes = false;

            // Apply only the highest absolute effect for this target.
            // (There aren't any absolute penalties, and absolute effects are usually untyped.)
            this._creatureEffectsService
                .reduceAbsolutes(effects
                    .filter((effect): effect is AbsoluteEffect =>
                        effect.target === target
                        && effect.applied === undefined
                        && effect.hasSetValue,
                    ),
                )
                .forEach(effect => {
                    hasAbsolutes = true;
                    effect.applied = true;
                });

            // Apply all untyped relative effects, but only the highest bonus and lowest penalty for each type for this target.
            // We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
            // Some types aren't applied if there are absolute effects for this target.
            this._creatureEffectsService
                .reduceRelativesByType(
                    effects.filter(effect =>
                        effect.target === target &&
                        effect.applied === undefined &&
                        effect.valueNumerical,
                    ),
                    { hasAbsolutes },
                )
                .forEach(effect => {
                    effect.applied = true;
                });

        });

        //Disable all effects that are not applied so far.
        effects.filter(effect => effect.applied === undefined).forEach(effect => {
            effect.applied = false;
        });

        //If an effect with the target "Ignore <type> bonuses and penalties" exists, all effects of that type are disabled.
        const doesIgnoreEffectExistsForType = (type: BonusTypes, effectType: string): boolean => (
            effects.some(effect =>
                !effect.ignored &&
                effect.target.toLowerCase() === `ignore ${ type.toLowerCase() } ${ effectType.toLowerCase() }`,
            )
        );

        Object.values(BonusTypes).forEach(type => {
            if (doesIgnoreEffectExistsForType(type, 'bonuses and penalties')) {
                effects.filter(effect => effect.type === type).forEach(effect => {
                    effect.applied = false;
                });
            }
        });

        const specificIgnoreEffectExists = (type: BonusTypes, effectType: string): boolean => (
            effects.some(effect =>
                !effect.ignored &&
                effect.target.toLowerCase().includes(`ignore ${ type.toLowerCase() } ${ effectType.toLowerCase() }`),
            )
        );

        //If there is an effect that says to ignore all <type> effects, bonuses or penalties [to a target],
        // all effects (or bonuses or penalties) to that target (or all targets) with that type are disabled.
        Object.values(BonusTypes).forEach(type => {
            effects
                .filter(effect =>
                    !effect.ignored &&
                    specificIgnoreEffectExists(type, 'effects') ||
                    specificIgnoreEffectExists(type, 'bonuses and penalties'),
                )
                .forEach(ignoreeffect => {
                    let target: string | undefined = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect =>
                            (
                                target === 'all' ||
                                effect.target.toLowerCase() === target
                            ) &&
                            effect.type.toLowerCase() === type.toLowerCase(),
                        )
                        .forEach(effect => {
                            effect.applied = false;
                        });
                });
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'bonuses'))
                .forEach(ignoreeffect => {
                    let target: string | undefined = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect =>
                            (
                                target === 'all' ||
                                effect.target.toLowerCase() === target
                            ) &&
                            effect.type === type &&
                            !effect.penalty,
                        )
                        .forEach(effect => {
                            effect.applied = false;
                        });
                });
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'penalties'))
                .forEach(ignoreeffect => {
                    let target: string | undefined = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect =>
                            (
                                target === 'all' ||
                                effect.target.toLowerCase() === target
                            ) &&
                            effect.type === type &&
                            effect.penalty,
                        )
                        .forEach(effect => {
                            effect.applied = false;
                        });
                });
        });
        //If an effect with the target "Ignore <name>" exists without a type, all effects of that name are disabled.
        effects
            .filter(effect =>
                !effect.ignored &&
                effect.target.toLowerCase().includes('ignore ') &&
                !Object.values(BonusTypes).some(type => effect.target.toLowerCase().includes(type.toLowerCase())),
            )
            .forEach(ignoreEffect => {
                const target = ignoreEffect.target.toLowerCase().replace('ignore ', '');

                effects.filter(effect => effect.target.toLowerCase() === target).forEach(effect => {
                    effect.applied = false;
                });
            });
        // If an effect with the target "Ignore absolute effects [on <name>]" exists without a type,
        // all absolute effects [on that target] are disabled.
        effects
            .filter(effect => !effect.ignored && effect.target.toLowerCase().includes('ignore absolute effects'))
            .forEach(ignoreeffect => {
                let target: string | undefined = 'all';

                if (ignoreeffect.target.toLowerCase().includes(' on ')) {
                    target = ignoreeffect.target.toLowerCase().split(' on ')[1];
                } else if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                    target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                }

                effects
                    .filter(effect =>
                        (
                            target === 'all' ||
                            effect.target.toLowerCase() === target
                        ) &&
                        effect.setValue,
                    )
                    .forEach(effect => {
                        effect.applied = false;
                    });
            });

        return effects;
    }

    private _setEffectsShown(effects: Array<Effect>): Array<Effect> {
        //Figure out whether to show or hide an effect if it isn't set already.
        effects
            .filter(effect => effect.displayed === undefined)
            .forEach(effect => {
                if (AlwaysShowingEffectNames.includes(effect.target.toLowerCase())) {
                    effect.displayed = true;
                } else if (AlwaysShowingWildcardEffectNames.some(wildcard => effect.target.toLowerCase().includes(wildcard))) {
                    effect.displayed = true;
                } else {
                    effect.displayed = false;
                }
            });

        return effects;
    }

    private _generateEffects$(
        creature: Creature,
    ): Observable<Array<Effect>> {
        // This function generates effects for the targeted creature from any possible source that bears effects.
        // The resulting effects are moved into the EffectsService and can be queried there.

        return combineLatest([
            //Fetch any effects from the other creatures that apply to this.
            this._effectsFromOtherCreatures$(creature),
            // Generate effects from the creature and any applicable activities, abilities,
            // conditions or items that have an effects[] property or active hints.
            this._generateObjectEffects$(creature),
        ])
            .pipe(
                map(effectsLists =>
                    new Array<Effect>()
                        .concat(
                            ...effectsLists,
                        ),
                ),
                switchMap(effects => {
                    // Generate effects that come from complex calculations based on properties of your equipped items.
                    // This is not done for familiars, which don't apply item bonuses.
                    // We need to take into account whether any previously generated effects could state
                    // that armor penalties or armor speed penalties are ignored.

                    //Skip all armor penalties if there is an "Ignore Armor Penalty" effect.
                    const shouldIgnoreArmorPenalties =
                        effects.some(effect =>
                            effect.creature === creature.id &&
                            effect.target === 'Ignore Armor Penalty' &&
                            effect.toggled,
                        );
                    //Skip speed penalties if there is an "Ignore Armor Speed Penalty" effect.
                    const shouldIgnoreArmorSpeedPenalties =
                        effects.some(effect =>
                            effect.creature === creature.id &&
                            effect.target === 'Ignore Armor Speed Penalty' &&
                            effect.toggled,
                        );

                    return this._generateCalculatedItemEffects$(
                        creature,
                        { ignoreArmorPenalties: shouldIgnoreArmorPenalties, ignoreArmorSpeedPenalties: shouldIgnoreArmorSpeedPenalties },
                    )
                        .pipe(
                            map(itemEffects => effects.concat(itemEffects)),
                        );
                }),
                switchMap(effects =>
                    //Apply any lessening of speed penalties that stems from a character's Unburdened Iron feat.
                    creature.isCharacter()
                        ? this._applyUnburdenedIron$(effects)
                        : of(effects),
                ),
                map(effects => {
                    // Split off effects that affect another creature for later.
                    // We don't want these to influence or be influenced by the next steps.
                    const effectsForOthers = effects.filter(effect => effect.creature !== creature.id);

                    let finalEffects = effects.filter(effect => effect.creature === creature.id);

                    // Enable ignored on all effects that match the creature's ignored effects list.
                    finalEffects = this._setEffectsIgnored(finalEffects, { creature });

                    // Enable or disable applied on all effects according to various considerations.
                    finalEffects = this._setEffectsApplied(finalEffects, { creature });

                    // Enable or disable shown on all effects depending on whether they match a list of targets.
                    finalEffects = this._setEffectsShown(finalEffects);

                    // Add back the effects that affect another creature.
                    return finalEffects.concat(effectsForOthers);
                }),
                distinctUntilChanged(isEqualSerializableArrayWithoutId),
                tap(effects => {
                    // Replace the global effects.
                    // This may cause observables involved in the effect generation to update and restart the process.
                    this._creatureEffectsService.replaceCreatureEffects(creature.type, effects);
                }),
            );
    }

    private _generateCreatureEffects$(creature: Creature): Observable<Array<Effect>> {
        // Perpetually regenerate effects for the creature.
        return this._generateEffects$(creature);
    }

}

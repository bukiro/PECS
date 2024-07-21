/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, of, combineLatest, map, switchMap } from 'rxjs';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { SpecializationGain } from 'src/app/classes/attacks/specialization-gain';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect, AbsoluteEffect, RelativeEffect } from 'src/app/classes/effects/effect';
import { Weapon } from 'src/app/classes/items/weapon';
import { BonusTypes } from 'src/libs/shared/definitions/bonus-types';
import { DiceSizes, DiceSizeBaseStep } from 'src/libs/shared/definitions/dice-sizes';
import { EmblazonArmamentTypes } from 'src/libs/shared/definitions/emblazon-armament-types';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weapon-proficiencies';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ItemSpecializationsDataService } from 'src/libs/shared/services/data/item-specializations-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { addBonusDescriptionFromEffect } from 'src/libs/shared/util/bonus-description-uils';
import { strikingTitleFromLevel } from 'src/libs/shared/util/rune-utils';
import { skillLevelName } from 'src/libs/shared/util/skill-utils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { attackEffectPhrases } from '../../util/attack-effect-phrases';
import { RuneSourceSet, attackRuneSource$ } from '../../util/attack-rune-rource';
import { ExtraDamageService } from './extra-damage.service';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';

export type DamageResult = IntermediateResult<string>;

export interface IntermediateResult<T> {
    result: T;
    bonuses: Array<BonusDescription>;
    effects: Array<Effect>;
}

export interface IntermediateMethodContext {
    weapon: Weapon;
    creature: Character | AnimalCompanion;
    range: 'ranged' | 'melee';
    prof: string;
    traits: Array<string>;
    runeSource: RuneSourceSet;
    isFavoredWeapon: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DamageService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _itemSpecializationsDataService: ItemSpecializationsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _extraDamageService: ExtraDamageService,
    ) { }

    /**
     * Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
     *
     * Returns a string in the form of "1d6+5 B\n+1d6 Fire".
     *
     * A weapon with no dice and no extra damage returns a damage of "0".
     */
    public damage$(
        weapon: Weapon,
        creature: Character | AnimalCompanion,
        range: 'ranged' | 'melee',
    ): Observable<DamageResult> {
        if (!weapon.dicenum && !weapon.dicesize && !weapon.extraDamage) {
            return of({ result: '0', bonuses: [], effects: [] });
        }

        return combineLatest([
            this._weaponPropertiesService.effectiveProficiency$(weapon, { creature }),
            attackRuneSource$(weapon, creature, range),
            this._weaponPropertiesService.isFavoredWeapon$(weapon, creature),
            weapon.effectiveTraits$,
        ])
            .pipe(
                map(([prof, runeSource, isFavoredWeapon, traits]) => ({
                    weapon,
                    creature,
                    range,
                    prof,
                    traits,
                    runeSource,
                    isFavoredWeapon,
                })),
                switchMap(context => combineLatest([
                    this._diceNumber$(context),
                    this._diceSize$(context),
                    this._extraDamageService.extraDamage$(context),
                ])
                    .pipe(
                        switchMap(([diceNum, diceSize, extraDamage]) =>
                            this._damageBonus$({ ...context, diceNum: diceNum.result })
                                .pipe(
                                    map(damageBonus => {
                                        const bonuses: Array<BonusDescription> = [
                                            weapon.dicenum
                                                ? {
                                                    title: 'Base dice',
                                                    value: `${ weapon.dicenum }d${ weapon.dicesize }`,
                                                }
                                                : {
                                                    title: 'Base damage',
                                                    value: `${ weapon.dicesize }`,
                                                },
                                            ...diceNum.bonuses,
                                            ...diceSize.bonuses,
                                            ...damageBonus.bonuses,
                                            ...extraDamage.bonuses,
                                        ];

                                        const effects: Array<Effect> = [
                                            ...diceNum.effects,
                                            ...diceSize.effects,
                                            ...damageBonus.effects,
                                        ];

                                        // Get the basic "#d#" string from the weapon's dice values,
                                        // unless dicenum is 0 or null.
                                        // In that case, add the damage to the damage bonus and ignore the #d# string.
                                        const dmgBonus =
                                            (diceNum.result ? 0 : diceSize.result)
                                            + damageBonus.result;

                                        const diceString =
                                            diceNum.result
                                                ? `${ diceNum.result }d${ diceSize.result }`
                                                // If the damage bonus is negative, add a non-null string to subtract it from.
                                                : (dmgBonus < 0 ? ' ' : '');

                                        // The dice and the bonus for a readable damage output.
                                        const result = [
                                            [
                                                [
                                                    diceString,
                                                    dmgBonus < 0
                                                        ? (-dmgBonus)
                                                        : dmgBonus,
                                                ]
                                                    .filter(part => !!part)
                                                    .join(dmgBonus < 0 ? ' - ' : ' + '),
                                                this._damageType(context),
                                            ]
                                                .join(' ')
                                                .trim(),
                                            ...extraDamage.result,
                                        ]
                                            .join('\n');

                                        return { result, bonuses, effects };
                                    }),

                                ),
                        ),
                    ),
                ),
            );
    }

    public critSpecialization$(weapon: Weapon, creature: Creature, range: string): Observable<Array<Specialization>> {
        if (!(creature.isCharacter() && weapon.group)) {
            return of([]);
        }

        return combineLatest([
            combineLatest([
                this._weaponPropertiesService.effectiveProficiency$(weapon, { creature }),
                attackRuneSource$(weapon, creature, range),
            ])
                .pipe(
                    switchMap(([prof, runeSource]) =>
                        this._weaponPropertiesService.profLevel$(
                            weapon,
                            creature,
                            runeSource.forPropertyRunes,
                            { preparedProficiency: prof },
                        )
                            .pipe(
                                map(skillLevel => ({ prof, skillLevel })),
                            ),
                    ),
                ),
            this._characterFeatsService.characterFeatsAtLevel$(),
            creature.level$,
            weapon.bladeAlly$,
            weapon.effectiveTraits$,
            this._weaponPropertiesService.isFavoredWeapon$(weapon, creature),
        ])
            .pipe(
                switchMap(([{ prof, skillLevel }, characterFeats, characterLevel, hasBladeAlly, traits, isFavoredWeapon]) =>
                    emptySafeCombineLatest(
                        characterFeats
                            .filter(feat =>
                                feat.gainSpecialization.length,
                            )
                            .map(feat => emptySafeCombineLatest(
                                feat.gainSpecialization
                                    .filter(spec =>
                                        (!spec.minLevel || characterLevel >= spec.minLevel)
                                        && (!spec.bladeAlly || hasBladeAlly)
                                        && (!spec.favoredWeapon || isFavoredWeapon)
                                        && (!spec.group || (weapon.group && spec.group.includes(weapon.group)))
                                        && (!spec.range || (range && spec.range.includes(range)))
                                        && (
                                            !spec.name
                                            || (
                                                (weapon.name && spec.name.includes(weapon.name))
                                                || (weapon.weaponBase && spec.name.includes(weapon.weaponBase))
                                            )
                                        )
                                        && (!spec.trait || traits.some(trait => spec.trait.includes(trait)))
                                        && (!spec.proficiency || (prof && spec.proficiency.includes(prof)))
                                        && (!spec.skillLevel || skillLevel >= spec.skillLevel),
                                    )
                                    .map(spec =>
                                        spec.featreq
                                            ? this._characterFeatsService.characterHasFeatAtLevel$(spec.featreq)
                                                .pipe(
                                                    map(hasFeat => hasFeat ? spec : null),
                                                )
                                            : of(spec),
                                    ),
                            )
                                .pipe(
                                    map(specializationGains =>
                                        specializationGains.filter((spec): spec is SpecializationGain => !!spec),
                                    ),
                                ),

                            ),
                    ),
                ),
                map(specializationGainLists => {
                    const specializations: Array<Specialization> = [];

                    new Array<SpecializationGain>()
                        .concat(...specializationGainLists)
                        .forEach(gainedSpec => {
                            const specs: Array<Specialization> =
                                this._itemSpecializationsDataService.specializations(weapon.group)
                                    .map(spec => spec.clone());

                            specs.forEach(spec => {
                                if (gainedSpec.condition) {
                                    spec.desc = `(${ gainedSpec.condition }) ${ spec.desc }`;
                                }

                                if (!specializations.some(existingspec => existingspec.desc === spec.desc)) {
                                    specializations.push(spec);
                                }
                            });
                        });

                    return specializations;
                }),
            );
    }

    private _diceNumber$(context: IntermediateMethodContext): Observable<IntermediateResult<number>> {
        //Determine the dice Number - Dice Number Multiplier first, then Dice Number (Striking included)
        if (!context.weapon.dicenum) {
            return of({ result: 0, bonuses: [], effects: [] });
        }

        return combineLatest([
            this._diceNumberMultiplier$(context),
            context.runeSource.forFundamentalRunes.effectiveStriking$(),
            // Diamond Fists adds the forceful trait to your unarmed attacks,
            // but if it already has the trait, it gains one damage die.
            // For this purpose, compare the weapon's original traits instead of the effective traits.
            (context.prof === WeaponProficiencies.Unarmed && stringsIncludeCaseInsensitive(context.weapon.traits, 'Forceful'))
                ? this._characterFeatsService.characterHasFeatAtLevel$('Diamond Fists')
                : of(false),
            context.runeSource.reason?.effectiveName$() ?? of(''),
        ])
            .pipe(
                switchMap(([diceNumMultiplier, strikingValue, diamondFistsApplies, runeReasonName]) => {
                    const diceNum = context.weapon.dicenum * diceNumMultiplier.result;
                    const effectPhrasesDiceNumber = attackEffectPhrases('Dice Number', context);
                    const calculatedAbsoluteDiceNumEffects: Array<AbsoluteEffect> = [];
                    const calculatedRelativeDiceNumEffects: Array<RelativeEffect> = [];

                    //Add the striking rune or oil of potency effect of the runeSource.
                    //Only apply and explain Striking if it's actually better than your multiplied dice number.
                    if (strikingValue + 1 > diceNum) {
                        let source = strikingTitleFromLevel(strikingValue);

                        //If you're getting the striking effect because of another item (like Doubling Rings), name it here
                        if (runeReasonName) {
                            source += ` (${ runeReasonName })`;
                        }

                        const effect = Effect.from({
                            creature: context.creature.type,
                            type: BonusTypes.Untyped,
                            target: `${ context.weapon.name } Dice Number`,
                            setValue: (strikingValue + 1).toString(),
                            source,
                            applied: true,
                            displayed: false,
                        });

                        if (effect.isAbsoluteEffect()) {
                            calculatedAbsoluteDiceNumEffects.push(effect);
                        }
                    }

                    if (diamondFistsApplies) {
                        calculatedRelativeDiceNumEffects.push(
                            Effect.from({
                                value: '+1',
                                creature: context.creature.type,
                                type: BonusTypes.Untyped,
                                target: `${ context.weapon.name } Dice Number`,
                                source: 'Diamond Fists',
                                applied: true,
                                displayed: false,
                            }),
                        );
                    }

                    // For any activated traits of this weapon, check if any effects on Dice Number apply.
                    // These need to be calculated in the effects service.
                    const traitEffects: Array<Effect> = [];

                    context.weapon.activatedTraitsActivations()
                        .forEach(activation => {
                            const realTrait = this._traitsDataService.traits(activation.trait)[0];

                            traitEffects.push(...realTrait.objectBoundEffects(activation, ['Dice Number']));
                        });

                    // Apply global effects and effects added in this method.
                    return combineLatest([
                        this._creatureEffectsService.absoluteEffectsOnThese$(context.creature, effectPhrasesDiceNumber),
                        this._creatureEffectsService.relativeEffectsOnThese$(context.creature, effectPhrasesDiceNumber),
                    ])
                        .pipe(
                            map(([absolutes, relatives]) => {
                                const effectBonuses = new Array<BonusDescription>();
                                let result = diceNum;

                                const reducedAbsolutes =
                                    this._creatureEffectsService.reduceAbsolutes(
                                        calculatedAbsoluteDiceNumEffects
                                            .concat(
                                                traitEffects.filter((effect): effect is AbsoluteEffect => effect.isAbsoluteEffect()),
                                                absolutes,
                                            ),
                                    );

                                reducedAbsolutes
                                    .forEach(effect => {
                                        result = effect.setValueNumerical;
                                        addBonusDescriptionFromEffect(effectBonuses, effect, 'Dice number');
                                    });

                                const reducedRelatives =
                                    this._creatureEffectsService.reduceRelativesByType(
                                        calculatedRelativeDiceNumEffects
                                            .concat(
                                                traitEffects.filter((effect): effect is RelativeEffect => effect.isRelativeEffect()),
                                                relatives,
                                            ),
                                        { hasAbsolutes: !!reducedAbsolutes.length },
                                    );

                                reducedRelatives.forEach(effect => {
                                    result += effect.valueNumerical;
                                    addBonusDescriptionFromEffect(effectBonuses, effect, 'Dice number');
                                });

                                const bonuses =
                                    diceNumMultiplier.bonuses
                                        .concat(effectBonuses);

                                const effects =
                                    diceNumMultiplier.effects
                                        .concat(
                                            absolutes,
                                            relatives,
                                        );

                                return { result, bonuses, effects };
                            }),
                        );
                }),
            );
    }

    private _diceNumberMultiplier$(context: IntermediateMethodContext): Observable<IntermediateResult<number>> {
        const effectPhrasesDiceNumberMult =
            attackEffectPhrases(
                'Dice Number Multiplier',
                context,
            );

        return combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThese$(context.creature, effectPhrasesDiceNumberMult),
            this._creatureEffectsService.relativeEffectsOnThese$(context.creature, effectPhrasesDiceNumberMult),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    let result = 1;
                    const bonuses = new Array<BonusDescription>();

                    absolutes
                        .forEach(effect => {
                            result = effect.setValueNumerical;
                            addBonusDescriptionFromEffect(bonuses, effect, 'Dice number multiplier');
                        });
                    relatives
                        .forEach(effect => {
                            result += effect.valueNumerical;
                            addBonusDescriptionFromEffect(bonuses, effect, 'Dice number multiplier');
                        });

                    const effects =
                        new Array<Effect>()
                            .concat(
                                absolutes,
                                relatives,
                            );

                    return { result, bonuses, effects };
                }),
            );
    }

    private _diceSize$(context: IntermediateMethodContext): Observable<IntermediateResult<number>> {
        if (!context.weapon.dicesize) {
            return of({ result: 0, bonuses: [], effects: [] });
        }

        const isDeificWeaponCandidate =
            context.isFavoredWeapon
            && (
                (
                    context.weapon.dicesize === DiceSizes.D4
                    && context.prof === WeaponProficiencies.Unarmed
                )
                || context.prof === WeaponProficiencies.Simple
            );

        const isDeadlySimplicityCandidate =
            context.isFavoredWeapon
            && (
                (
                    context.weapon.dicesize < DiceSizes.D6
                    && context.prof === WeaponProficiencies.Unarmed
                )
                || context.prof === WeaponProficiencies.Simple
            );

        return combineLatest([
            // Champions get increased dice size via Deific Weapon for unarmed attacks with d4 damage
            // or simple weapons as long as they are their deity's favored weapon.
            isDeificWeaponCandidate
                ? this._characterFeatsService.characterHasFeatAtLevel$('Deific Weapon')
                : of(false),
            // Clerics get increased dice size via Deadly Simplicity for unarmed attacks with less than d6 damage
            // or simple weapons as long as they are their deity's favored weapon.
            isDeadlySimplicityCandidate
                ? this._characterFeatsService.characterHasFeatAtLevel$('Deadly Simplicity')
                : of(false),
        ])
            .pipe(
                switchMap(([deificWeaponApplies, deadlySimplicityApplies]) => {
                    const effectPhrasesDiceSize = attackEffectPhrases('Dice Size', context);
                    const calculatedAbsoluteDiceSizeEffects: Array<AbsoluteEffect> = [];
                    const weaponDiceSize = context.weapon.dicesize;

                    if (deificWeaponApplies) {
                        const newDicesize = Math.max(Math.min(weaponDiceSize + DiceSizeBaseStep, DiceSizes.D12), DiceSizes.D6);

                        if (newDicesize > weaponDiceSize) {
                            const effect = Effect.from({
                                creature: context.creature.type,
                                type: BonusTypes.Untyped,
                                target: `${ context.weapon.name } Dice Size`,
                                setValue: newDicesize.toString(),
                                source: 'Deific Weapon',
                                applied: true,
                                displayed: false,
                            });

                            if (effect.isAbsoluteEffect()) {
                                calculatedAbsoluteDiceSizeEffects.push(effect);
                            }
                        }
                    }

                    if (deadlySimplicityApplies) {
                        const newDicesize: DiceSizes =
                            (weaponDiceSize < DiceSizes.D6 && context.prof === WeaponProficiencies.Unarmed)
                                ? DiceSizes.D6
                                : Math.max(Math.min(weaponDiceSize + DiceSizeBaseStep, DiceSizes.D12), DiceSizes.D6);

                        if (newDicesize > weaponDiceSize) {
                            const effect = Effect.from({
                                creature: context.creature.type,
                                type: BonusTypes.Untyped,
                                target: `${ context.weapon.name } Dice Size`,
                                setValue: newDicesize.toString(),
                                source: 'Deadly Simplicity',
                                applied: true,
                                displayed: false,
                            });

                            if (effect.isAbsoluteEffect()) {
                                calculatedAbsoluteDiceSizeEffects.push(effect);
                            }
                        }
                    }

                    // For any activated traits of this weapon, check if any effects on Dice Size apply.
                    // These need to be calculated in the effects service.
                    const traitEffects: Array<Effect> = [];

                    context.weapon.activatedTraitsActivations().forEach(activation => {
                        const realTrait = this._traitsDataService.traits(activation.trait)[0];

                        traitEffects.push(...realTrait.objectBoundEffects(activation, ['Dice Size']));
                    });

                    // Apply global effects and effects added in this method.
                    return combineLatest([
                        this._creatureEffectsService.absoluteEffectsOnThese$(context.creature, effectPhrasesDiceSize),
                        this._creatureEffectsService.relativeEffectsOnThese$(context.creature, effectPhrasesDiceSize),
                    ])
                        .pipe(
                            map(([absolutes, relatives]) => {
                                let result = weaponDiceSize;
                                const bonuses = new Array<BonusDescription>();

                                const reducedAbsolutes =
                                    this._creatureEffectsService.reduceAbsolutes(
                                        calculatedAbsoluteDiceSizeEffects
                                            .concat(
                                                traitEffects.filter((effect): effect is AbsoluteEffect => effect.isAbsoluteEffect()),
                                                absolutes,
                                            ),
                                    );

                                reducedAbsolutes.forEach(effect => {
                                    result = effect.setValueNumerical;
                                    addBonusDescriptionFromEffect(bonuses, effect, 'Dice size');
                                });

                                const reducedRelatives =
                                    this._creatureEffectsService.reduceRelativesByType(
                                        traitEffects
                                            .filter((effect): effect is RelativeEffect => effect.isRelativeEffect())
                                            .concat(relatives),
                                        { hasAbsolutes: !!reducedAbsolutes.length },
                                    );

                                reducedRelatives
                                    .forEach(effect => {
                                        result += effect.valueNumerical;
                                        //Don't raise dice size over 12.
                                        result = Math.min(DiceSizes.D12, result);
                                        addBonusDescriptionFromEffect(bonuses, effect, 'Dice size');
                                    });

                                const effects =
                                    new Array<Effect>()
                                        .concat(
                                            absolutes,
                                            relatives,
                                        );

                                return { result, bonuses, effects };
                            }),
                        );
                }),
            );
    }

    private _damageBonus$(context: IntermediateMethodContext & { diceNum: number }): Observable<IntermediateResult<number>> {
        return combineLatest([
            this._creatureEffectsService.effectsOnThis$(context.creature, `Ignore Bonus Damage on ${ context.weapon.name }`)
                .pipe(
                    switchMap(shouldIgnoreBonusDamageEffects =>
                        (
                            // If any effects exist that ignore bonus damage on this weapon, no relative effects need to be determined.
                            shouldIgnoreBonusDamageEffects.length
                                ? combineLatest([
                                    of(undefined), of([]), of(undefined), of([]),
                                ])
                                : combineLatest([
                                    this._damageBonusEffectFromAbility$(context),
                                    this._damageBonusEffectsFromAnimalCompanionSpecialization$(context),
                                    this._damageBonusEffectFromEmblazonArmament$(context),
                                    this._damagePerDieEffects$(context),
                                ])
                        )
                            .pipe(
                                map(relativeEffects => ({
                                    shouldIgnoreRelativeEffects: shouldIgnoreBonusDamageEffects.length,
                                    relativeEffects,
                                })),
                            ),
                    ),
                ),
            this._weaponPropertiesService.profLevel$(
                context.weapon,
                context.creature,
                context.runeSource.forPropertyRunes,
                { preparedProficiency: context.prof },
            ),
            context.weapon.large$,
        ])
            .pipe(
                switchMap(([
                    {
                        shouldIgnoreRelativeEffects,
                        relativeEffects: [
                            abilityEffect,
                            companionEffects,
                            emblazonArmamentEffect,
                            damagePerDieEffects,
                        ],
                    },
                    profLevel,
                    isLargeWeapon,
                ]) => {
                    // Build a long list of effect targets to check for effects that may influence the bonus damage.

                    // "Damage" and "Damage Rolls"
                    const effectPhrasesDamage =
                        attackEffectPhrases('Damage', context)
                            .concat(
                                attackEffectPhrases('Damage Rolls', context),
                            );
                    const agile = context.traits.includes('Agile') ? 'Agile' : 'Non-Agile';

                    //"Agile/Non-Agile Large Melee Weapon Damage"
                    if (isLargeWeapon) {
                        effectPhrasesDamage.push(
                            `${ agile } Large ${ context.range } Weapon Damage`,
                            `${ agile } Large ${ context.range } Weapon Damage Rolls`,
                        );
                    }

                    //"Agile/Non-Agile Melee Damage"
                    effectPhrasesDamage.push(
                        `${ agile } ${ context.range } Damage`,
                        `${ agile } ${ context.range } Damage Rolls`,
                    );

                    // Thrown weapon attacks
                    if ((context.range === 'ranged') && context.traits.some(trait => trait.includes('Thrown'))) {
                        //"Agile/Non-Agile Thrown Large Weapon Damage"
                        if (isLargeWeapon) {
                            effectPhrasesDamage.push(
                                `${ agile } Thrown Large Weapon Damage`,
                                `${ agile } Thrown Large Weapon Damage Rolls`,
                            );
                        }

                        //"Agile/Non-Agile Thrown Weapon Damage"
                        effectPhrasesDamage.push(
                            `${ agile } Thrown Weapon Damage`,
                            `${ agile } Thrown Weapon Damage Rolls`,
                        );
                    }

                    if (abilityEffect) {
                        //"Strength-based Checks and DCs"
                        effectPhrasesDamage.push(`${ abilityEffect.ability }-based Checks and DCs`);
                    }

                    //Proficiency-based damage
                    const profLevelName = skillLevelName(profLevel) || '';

                    if (profLevelName) {
                        effectPhrasesDamage.push(
                            `${ profLevelName } Proficiency Attack Damage`,
                            `${ profLevelName } Proficiency Attack Damage Rolls`,
                            `Trained Proficiency ${ context.weapon.name } Damage`,
                            `Trained Proficiency ${ context.weapon.name } Damage Rolls`,
                        );
                    }

                    // Absolute effects are always applied.
                    // Relative effects are applied unless an effect says not to.
                    return combineLatest([
                        this._creatureEffectsService.absoluteEffectsOnThese$(context.creature, effectPhrasesDamage),
                        shouldIgnoreRelativeEffects
                            ? of([])
                            : this._creatureEffectsService.relativeEffectsOnThese$(context.creature, effectPhrasesDamage),
                    ])
                        .pipe(
                            map(([absolutes, relatives]) => {
                                let result = 0;
                                const bonuses = new Array<BonusDescription>();

                                absolutes
                                    .forEach(effect => {
                                        result = effect.setValueNumerical;
                                        addBonusDescriptionFromEffect(bonuses, effect, 'Bonus damage');
                                    });

                                const allRelatives =
                                    this._creatureEffectsService.reduceRelativesByType(
                                        new Array<RelativeEffect>()
                                            .concat(
                                                abilityEffect?.effect ? [abilityEffect?.effect] : [],
                                                companionEffects,
                                                emblazonArmamentEffect ? [emblazonArmamentEffect] : [],
                                                damagePerDieEffects,
                                                relatives,
                                            ),
                                    );

                                allRelatives
                                    .forEach(effect => {
                                        result += effect.valueNumerical;
                                        addBonusDescriptionFromEffect(bonuses, effect, 'Bonus Damage');
                                    });

                                const effects: Array<Effect> = [
                                    ...absolutes,
                                    ...allRelatives,
                                ];

                                return { result, bonuses, effects };
                            }),
                        );
                }),
            );
    }

    /**
     * Creates an effect that adds an ability modifier bonus to Damage if one applies.
     * Determines whether to use dexterity or strength.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _damageBonusEffectFromAbility$(
        context: IntermediateMethodContext,
    ): Observable<{ effect: RelativeEffect; ability: 'Dexterity' | 'Strength' } | undefined> {
        //Weapons with the Splash trait do not add your Strength modifier (and presumably not your Dexterity modifier, either).
        if (context.traits.includes('Splash')) {
            return of(undefined);
        }

        const isThiefCandidate =
            context.range === 'melee'
            && context.traits.includes('Finesse')
            && context.creature.isCharacter();

        return combineLatest([
            this._abilityValuesService.mod$('Dexterity', context.creature),
            this._abilityValuesService.mod$('Strength', context.creature),
            this._creatureEffectsService.relativeEffectsOnThis$(context.creature, 'Dexterity-based Checks and DCs'),
            this._creatureEffectsService.relativeEffectsOnThis$(context.creature, 'Strength-based Checks and DCs'),
            //If the melee weapon is Finesse and you have the Thief Racket, you apply your Dexterity modifier to damage if it is higher.
            isThiefCandidate
                ? this._characterFeatsService.characterHasFeatAtLevel$('Thief Racket')
                : of(false),
        ])
            .pipe(
                map(([{ result: dex }, { result: str }, dexEffects, strEffects, thiefApplies]) => {
                    // Bonuses and penalties to the resulting ability may make another ability more attractive later in the process.
                    // We include these bonuses and penalties here for comparison, without applying them to the resulting effect.
                    const dexCompareValue =
                        dexEffects.reduce(
                            (previous, current) => previous + current.valueNumerical,
                            dex,
                        );
                    const strCompareValue =
                        strEffects.reduce(
                            (previous, current) => previous + current.valueNumerical,
                            str,
                        );

                    let result: { value: number; ability: 'Dexterity' | 'Strength'; reason: string } | undefined;

                    // Check if the ranged Weapon has any traits that affect its damage Bonus,
                    // such as Thrown or Propulsive, and run those calculations.
                    if (context.range === 'ranged') {
                        if (context.traits.includes('Propulsive')) {
                            const half = .5;

                            if (str > 0) {
                                result = { value: Math.floor(str * half), ability: 'Strength', reason: 'Propulsive' };
                            } else if (str < 0) {
                                result = { value: str, ability: 'Strength', reason: 'Propulsive' };
                            }
                        } else if (context.traits.some(trait => trait.includes('Thrown'))) {
                            result = { value: str, ability: 'Strength', reason: 'Thrown' };
                        }
                    }

                    if (context.range === 'melee') {
                        // If the weapon is Finesse and you have the Thief Racket,
                        // you can apply your Dexterity modifier to damage if it is higher.
                        if (thiefApplies && dexCompareValue > strCompareValue) {
                            if (dexCompareValue > strCompareValue) {
                                result = { value: dex, ability: 'Dexterity', reason: 'Thief' };
                            } else {
                                result = { value: str, ability: 'Strength', reason: '' };
                            }
                        }

                        result = { value: str, ability: 'Strength', reason: '' };
                    }

                    // If an ability was determined, create an effect that will be applied to the damage bonus later.
                    if (result) {
                        let source =
                            result.ability === 'Dexterity'
                                ? 'Dexterity Modifier'
                                : 'Strength Modifier';

                        if (result.reason) {
                            source += ` (${ result.reason })`;
                        }

                        return {
                            ability: result.ability,
                            effect: Effect.from({
                                value: result.value.toString(),
                                creature: context.creature.type,
                                type: BonusTypes.Untyped,
                                target: `${ context.weapon.name } Damage`,
                                source,
                                applied: true,
                                displayed: false,
                            }),
                        };
                    }
                }),
            );
    }

    /**
     * Create effects that raise the attack's damage due to the creature being a mature or specialized animal companion.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _damageBonusEffectsFromAnimalCompanionSpecialization$(context: IntermediateMethodContext): Observable<Array<RelativeEffect>> {
        return context.creature.isAnimalCompanion()
            ? combineLatest([
                context.creature.level$,
                context.creature.class.levels.values$,
                context.creature.class.specializations.values$,
            ])
                .pipe(
                    map(([creatureLevel, levels, specializations]) =>
                        levels
                            .filter(level => level.number <= creatureLevel && level.extraDamage)
                            .map(level => {
                                let companionSource = `${ level.name } Animal Companion`;
                                let companionMod: number = level.extraDamage;

                                if (specializations.length) {
                                    const double = 2;

                                    companionMod *= double;
                                    companionSource = 'Specialized Animal Companion';
                                }

                                return Effect.from({
                                    value: companionMod.toString(),
                                    creature: context.creature.type,
                                    type: BonusTypes.Untyped,
                                    target: `${ context.weapon.name } Damage`,
                                    source: companionSource,
                                    applied: true,
                                    displayed: false,
                                });
                            }),
                    ),
                )
            : of([]);
    }

    /**
     * Create an effect if Emblazon Armament applies on the attack.
     * Emblazon Armament on a weapon adds a +1 status bonus to damage rolls if it applies.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _damageBonusEffectFromEmblazonArmament$(context: IntermediateMethodContext): Observable<RelativeEffect | undefined> {
        return context.creature.isCharacter()
            ? context.weapon.effectiveEmblazonArmament$
                .pipe(
                    map(emblazonArmament =>
                        (emblazonArmament?.type === EmblazonArmamentTypes.EmblazonArmament)
                            ? Effect.from({
                                value: '+1',
                                creature: context.creature.type,
                                type: BonusTypes.Status,
                                target: `${ context.weapon.name } Damage`,
                                source: 'Emblazon Armament',
                                applied: true,
                                displayed: false,
                            })
                            : undefined,
                    ),
                )
            : of(undefined);
    }

    private _damageType(context: IntermediateMethodContext): string {
        return [
            context.weapon.dmgType,
            // Any effective versatile trait that is not among the weapon's original traits
            // may add the additional damage type extracted from the trait.
            ...context.traits
                .filter(trait =>
                    stringEqualsCaseInsensitive(trait, 'versatile', { allowPartialString: true })
                    && !stringsIncludeCaseInsensitive(context.weapon.traits, trait),
                )
                .map(trait =>
                    trait.split(' ')[1],
                ),
        ]
            .filter(type => !!type)
            .join('/');
    }

    /**
     * Generate and collect effects that add bonus damage per damage die.
     * These can come from activated traits or from global effects.
     *
     * @param context
     */
    private _damagePerDieEffects$(context: IntermediateMethodContext & { diceNum: number }): Observable<Array<RelativeEffect>> {
        // For any activated traits of this weapon, check if any effects on Damage per Die apply.
        const traitEffects: Array<Effect> = [];

        context.weapon.activatedTraitsActivations().forEach(activation => {
            const realTrait = this._traitsDataService.traits(activation.trait)[0];

            traitEffects.push(...realTrait.objectBoundEffects(activation, ['Damage per Die']));
        });

        const effectPhrasesDamagePerDie: Array<string> = [];

        if (context.prof === 'Unarmed Attacks') {
            effectPhrasesDamagePerDie.push('Unarmed Damage per Die');
        } else {
            effectPhrasesDamagePerDie.push('Weapon Damage per Die');
        }

        context.traits.forEach(trait => {
            // Reduce traits like "Thrown 20 ft." to "Thrown".
            //TODO: May cause trouble in the future if a trait has multiple words and a range, like "Ranged Trip 30 ft."
            if (trait.includes(' ft')) {
                effectPhrasesDamagePerDie.push(`${ trait.split(' ')[0] } Damage per Die`);
            } else {
                effectPhrasesDamagePerDie.push(`${ trait } Damage per Die`);
            }
        });

        return this._creatureEffectsService.relativeEffectsOnThese$(context.creature, effectPhrasesDamagePerDie)
            .pipe(
                map(relatives =>
                    // All "...Damage per Die" effects are converted to just "...Damage"
                    // (by multiplying with the dice number)
                    // and then re-processed with the rest of the damage effects.
                    traitEffects
                        .filter((effect): effect is RelativeEffect => effect.isRelativeEffect())
                        .concat(relatives)
                        .map(effect => {
                            const effectValue = effect.valueNumerical * context.diceNum;
                            const newEffect = effect.clone();

                            newEffect.target = newEffect.target.replace(' per Die', '');
                            newEffect.value = effectValue.toString();

                            return newEffect as RelativeEffect;
                        }),
                ),
            );
    }

}

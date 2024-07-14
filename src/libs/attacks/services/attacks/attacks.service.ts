import { Injectable } from '@angular/core';
import { Observable, combineLatest, switchMap, map, of } from 'rxjs';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Effect, AbsoluteEffect, RelativeEffect } from 'src/app/classes/effects/effect';
import { Weapon } from 'src/app/classes/items/weapon';
import { BonusTypes } from 'src/libs/shared/definitions/bonus-types';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddy-penalties';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weapon-proficiencies';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { BonusDescription } from 'src/libs/shared/ui/bonus-list';
import { addBonusDescriptionFromEffect } from 'src/libs/shared/util/bonus-description-uils';
import { skillLevelName } from 'src/libs/shared/util/skill-utils';
import { attackEffectPhrases } from '../../util/attack-effect-phrases';
import { RuneSourceSet, attackRuneSource$ } from '../../util/attack-rune-rource';

export interface AttackResult {
    range: 'ranged' | 'melee';
    result: number;
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
export class AttacksService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    /**
     * Calculates the attack bonus for a melee or ranged attack with weapon weapon.
     *
     * @param weapon
     * @param creature
     * @param range
     * @returns A set of range, attack bonus, bonus descriptions and effects.
     */
    public attack$(
        weapon: Weapon,
        creature: Character | AnimalCompanion,
        range: 'ranged' | 'melee',
    ): Observable<AttackResult> {
        return combineLatest([
            CharacterFlatteningService.characterLevel$,
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
                                map(skillLevel => ({ prof, runeSource, skillLevel })),
                            ),
                    ),
                ),
            this._weaponPropertiesService.isFavoredWeapon$(weapon, creature),
            weapon.effectiveTraits$,
        ])
            .pipe(
                map(([charLevel, { prof, runeSource, skillLevel }, isFavoredWeapon, traits]) => ({
                    charLevel,
                    skillLevel,
                    context: {
                        weapon,
                        creature,
                        range,
                        prof,
                        traits,
                        runeSource,
                        isFavoredWeapon,
                    },
                })),
                switchMap(({ charLevel, skillLevel, context }) =>
                    this._attackBonusEffectFromAbility$(context)
                        .pipe(
                            switchMap(abilityEffect => {
                                // For any activated traits of weapon weapon, check if any effects on Attack apply.
                                const traitEffects: Array<Effect> = [];

                                weapon.activatedTraitsActivations().forEach(activation => {
                                    const realTrait = this._traitsDataService.traits(activation.trait)[0];

                                    traitEffects.push(...realTrait.objectBoundEffects(activation, ['Attack']));
                                });

                                // Create a list of all target names under which an effect may affect this attack.
                                const effectsListAttackRolls =
                                    attackEffectPhrases(
                                        'Attack Rolls',
                                        context,
                                    )
                                        .concat([
                                            weapon.name,
                                            'Attack Rolls',
                                            'All Checks and DCs',
                                            ...(
                                                abilityEffect?.ability
                                                    ? [
                                                        //"Strength-based Checks and DCs", "Dexterity-based Checks and DCs"
                                                        `${ abilityEffect.ability }-based Checks and DCs`,
                                                        //"Strength-based Attack Rolls", "Dexterity-based Attack Rolls"
                                                        `${ abilityEffect.ability }-based Attack Rolls`,
                                                    ]
                                                    : []
                                            ),
                                            //"Untrained Attack Rolls", "Expert Attack Rolls"
                                            `${ skillLevelName(skillLevel) } Attack Rolls`,
                                        ]);

                                return combineLatest([
                                    this._creatureEffectsService.absoluteEffectsOnThese$(creature, effectsListAttackRolls),
                                    this._creatureEffectsService.relativeEffectsOnThese$(creature, effectsListAttackRolls),
                                    this._attackBonusEffectFromPotencyRune$(context),
                                    this._attackBonusEffectFromBattleForged$(context),
                                    this._attackPenaltyEffectFromShoddy$(context),
                                    (context.prof === WeaponProficiencies.Unarmed && context.creature.isCharacter())
                                        ? this._characterFeatsService.characterHasFeatAtLevel$('Powerful Fist')
                                        : of(false),
                                ])
                                    .pipe(
                                        map(([
                                            absolutes,
                                            relatives,
                                            potencyEffect,
                                            battleForgedEffect,
                                            shoddyEffect,
                                            powerfulFistApplies,
                                        ]) => {
                                            const bonuses = new Array<BonusDescription>();

                                            // If the creature is trained or better with the weapon,
                                            // add the skill level bonus and the character level.
                                            if (skillLevel >= SkillLevels.Trained) {
                                                bonuses.push({ value: skillLevel.toString(), title: skillLevelName(skillLevel) });
                                                bonuses.push({ value: charLevel.toString(), title: 'Character Level' });
                                            }

                                            let result =
                                                (skillLevel >= SkillLevels.Trained)
                                                    ? skillLevel + charLevel
                                                    : 0;

                                            const reducedAbsolutes = this._creatureEffectsService.reduceAbsolutes(
                                                traitEffects.filter((effect): effect is AbsoluteEffect => effect.isAbsoluteEffect())
                                                    .concat(absolutes),
                                            );

                                            reducedAbsolutes.forEach(effect => {
                                                result = effect.setValueNumerical;
                                                addBonusDescriptionFromEffect(bonuses, effect);
                                            });

                                            const reducedRelatives = this._creatureEffectsService.reduceRelativesByType(
                                                new Array<RelativeEffect>()
                                                    .concat(
                                                        ...(abilityEffect ? [abilityEffect.effect] : []),
                                                        ...(potencyEffect ? [potencyEffect] : []),
                                                        ...(battleForgedEffect ? [battleForgedEffect] : []),
                                                        ...(shoddyEffect?.effect ? [shoddyEffect.effect] : []),
                                                        ...traitEffects
                                                            .filter((effect): effect is RelativeEffect => effect.isRelativeEffect()),
                                                        ...relatives,
                                                    ),
                                                { hasAbsolutes: !!reducedAbsolutes.length },
                                            );

                                            reducedRelatives
                                                .forEach(effect => {
                                                    // A character with Powerful Fist ignores the nonlethal penalty on unarmed attacks.
                                                    if (powerfulFistApplies && effect.source === 'conditional, Nonlethal') {
                                                        bonuses.push({ value: '-0', title: 'Nonlethal (cancelled by Powerful Fist)' });
                                                    } else {
                                                        result += effect.valueNumerical;
                                                        addBonusDescriptionFromEffect(bonuses, effect);
                                                    }
                                                });

                                            // If the shoddy penalty was cancelled, add this information to the bonus descriptions.
                                            if (shoddyEffect?.cancelled) {
                                                bonuses.push({ value: '-0', title: 'Shoddy (cancelled by Junk Tinker)' });
                                            }

                                            const effects = new Array<Effect>()
                                                .concat(
                                                    reducedAbsolutes,
                                                    reducedRelatives,
                                                );

                                            return { result, bonuses, effects, range };
                                        }),
                                    );

                            }),
                        ),
                ),
            );
    }

    /**
     * Creates an effect that adds an ability modifier bonus to Attack if one applies.
     * Determines whether to use dexterity or strength.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _attackBonusEffectFromAbility$(
        context: IntermediateMethodContext,
    ): Observable<{ effect: RelativeEffect; ability: 'Dexterity' | 'Strength' } | undefined> {
        return combineLatest([
            this._abilityValuesService.mod$('Dexterity', context.creature),
            this._abilityValuesService.mod$('Strength', context.creature),
            this._creatureEffectsService.relativeEffectsOnThese$(
                context.creature,
                ['Dexterity-based Checks and DCs', 'Dexterity-based Attack Rolls'],
            ),
            this._creatureEffectsService.relativeEffectsOnThese$(
                context.creature,
                ['Strength-based Checks and DCs', 'Strength-based Attack Rolls'],
            ),
        ])
            .pipe(
                map(([{ result: dex }, { result: str }, dexEffects, strEffects]) => {
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

                    // Check if the weapon has any traits that affect its Ability bonus to attack,
                    // such as Finesse or Brutal, and run those calculations.
                    if (context.range === 'ranged') {
                        if (context.traits.includes('Brutal')) {
                            result = { value: str, ability: 'Strength', reason: 'Brutal' };
                        } else {
                            result = { value: dex, ability: 'Dexterity', reason: '' };
                        }
                    }

                    if (context.range === 'melee') {
                        if (context.traits.includes('Finesse') && dexCompareValue > strCompareValue) {
                            result = { value: dex, ability: 'Dexterity', reason: 'Finesse' };
                        } else if (context.weapon.dexterityBased) {
                            result = { value: dex, ability: 'Dexterity', reason: 'Dexterity-based weapon' };
                        } else {
                            result = { value: str, ability: 'Strength', reason: '' };
                        }
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
                                target: context.weapon.name,
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
     * Creates an effect that adds an ability modifier bonus to Attack if one applies.
     * Determines whether to use dexterity or strength.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _attackBonusEffectFromPotencyRune$(
        context: IntermediateMethodContext,
    ): Observable<RelativeEffect | undefined> {
        return combineLatest([
            context.runeSource.forFundamentalRunes.effectivePotency$(),
            context.runeSource.reason?.effectiveName$() ?? of(''),
        ])
            .pipe(
                map(([potencyRune, reasonName]) => {
                    if (potencyRune) {
                        //If you're getting the potency because of another item (like Doubling Rings), name it here
                        const source =
                            (reasonName)
                                ? `Potency (${ reasonName })`
                                : 'Potency';

                        return Effect.from({
                            value: potencyRune.toString(),
                            creature: context.creature.type,
                            type: BonusTypes.Item,
                            target: context.weapon.name,
                            source,
                            applied: true,
                            displayed: false,
                        });
                    }
                }),
            );
    }

    /**
     * Creates an effect that adds a bonus to Attack if battleforged applies.
     * Battleforged can add a +1 bonus to Attack on a weapon.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _attackBonusEffectFromBattleForged$(
        context: IntermediateMethodContext,
    ): Observable<RelativeEffect | undefined> {
        return combineLatest([
            context.runeSource.forFundamentalRunes.battleforged$,
            context.runeSource.reason?.effectiveName$() ?? of(''),
        ])
            .pipe(
                map(([isBattleForged, reasonName]) => {
                    if (isBattleForged) {
                        let source = 'Battleforged';

                        //If you're getting the battleforged bonus because of another item (like Handwraps of Mighty Blows), name it here.
                        if (reasonName) {
                            source = `Battleforged (${ reasonName })`;
                        }

                        return Effect.from({
                            value: '+1',
                            creature: context.creature.type,
                            type: BonusTypes.Item,
                            target: context.weapon.name,
                            source,
                            applied: true,
                            displayed: false,
                        });
                    }
                }),
            );
    }

    /**
     * Creates an effect that adds a penalty to Attack if shoddy applies.
     * Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
     * The latter is not implemented.
     *
     * @param context Previously determined parameters passed from the parent.
     * @returns
     */
    private _attackPenaltyEffectFromShoddy$(
        context: IntermediateMethodContext,
    ): Observable<{ effect?: RelativeEffect; cancelled?: boolean } | undefined> {
        return context.weapon.effectiveShoddy$
            .pipe(
                map(effectiveShoddy => {
                    if ((effectiveShoddy === ShoddyPenalties.NotShoddy) && context.weapon.shoddy) {
                        return { cancelled: true };
                    } else if (context.weapon.effectiveShoddy$) {
                        return {
                            effect:
                                Effect.from({
                                    value: `${ ShoddyPenalties.Shoddy }`,
                                    creature: context.creature.type,
                                    type: BonusTypes.Item,
                                    target: context.weapon.name,
                                    source: 'Shoddy',
                                    penalty: true,
                                    applied: true,
                                    displayed: false,
                                }),
                        };
                    }
                }),
            );
    }

}

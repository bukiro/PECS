import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Effect } from 'src/app/classes/Effect';
import { Weapon } from 'src/app/classes/Weapon';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddyPenalties';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { ItemTraitsService } from 'src/libs/shared/services/item-traits/item-traits.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { SignNumber } from 'src/libs/shared/util/numberUtils';
import { SkillLevelName } from 'src/libs/shared/util/skillUtils';
import { attackEffectPhrases } from '../../util/attackEffectPhrases';
import { attackRuneSource } from '../../util/attackRuneSource';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';

export interface AttackResult {
    range: string;
    attackResult: number;
    explain: string;
    effects: Array<Effect>;
    penalties: Array<Effect>;
    bonuses: Array<Effect>;
    absolutes: Array<Effect>;
}
export interface DamageResult {
    damageResult: string;
    explain: string;
    penalties: Array<Effect>;
    bonuses: Array<Effect>;
    absolutes: Array<Effect>;
}

@Injectable({
    providedIn: 'root',
})
export class AttacksService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _itemTraitsService: ItemTraitsService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public attack(
        weapon: Weapon,
        creature: Character | AnimalCompanion,
        range: string,
    ): AttackResult {
        //Calculates the attack bonus for a melee or ranged attack with weapon weapon.
        let explain = '';
        const charLevel = this._characterService.character.level;
        const str = this._abilityValuesService.mod('Strength', creature).result;
        const dex = this._abilityValuesService.mod('Dexterity', creature).result;
        const runeSource = attackRuneSource(weapon, creature, range);
        const skillLevel = this._weaponPropertiesService.profLevel(weapon, creature, runeSource.propertyRunes);

        this._itemTraitsService.cacheItemEffectiveTraits(weapon, { creature });

        const traits = weapon.$traits;

        if (skillLevel) {
            explain += `\nProficiency: ${ skillLevel }`;
        }

        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        const charLevelBonus = ((skillLevel > 0) ? charLevel : 0);

        if (charLevelBonus) {
            explain += `\nCharacter Level: +${ charLevelBonus }`;
        }

        const penalties: Array<Effect> = [];
        const bonuses: Array<Effect> = [];
        const absolutes: Array<Effect> = [];
        //Calculate dexterity and strength penalties for the decision on which to use. They are not immediately applied.
        //The Clumsy condition affects all Dexterity attacks.
        const dexEffects =
            this._effectsService.relativeEffectsOnThese(creature, ['Dexterity-based Checks and DCs', 'Dexterity-based Attack Rolls']);
        const dexPenalty: Array<Effect> = [];
        let dexPenaltySum = 0;

        dexEffects.forEach(effect => {
            dexPenalty.push(
                Object.assign(
                    new Effect(),
                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: true },
                ),
            );
            dexPenaltySum += parseInt(effect.value, 10);
        });

        //The Enfeebled condition affects all Strength attacks
        const strEffects =
            this._effectsService.relativeEffectsOnThese(creature, ['Strength-based Checks and DCs', 'Strength-based Attack Rolls']);
        const strPenalty: Array<Effect> = [];
        let strPenaltySum = 0;

        strEffects.forEach(effect => {
            strPenalty.push(
                Object.assign(
                    new Effect(),
                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: true },
                ),
            );
            strPenaltySum += parseInt(effect.value, 10);
        });

        let isDexUsed = false;
        let isStrUsed = false;
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let abilityMod = 0;

        if (range === 'ranged') {
            if (traits.includes('Brutal')) {
                abilityMod = str;
                explain += `\nStrength Modifier (Brutal): ${ SignNumber(abilityMod) }`;
                isStrUsed = true;

            } else {
                abilityMod = dex;
                explain += `\nDexterity Modifier: ${ SignNumber(abilityMod) }`;
                isDexUsed = true;
            }
        } else {
            if (traits.includes('Finesse') && dex + dexPenaltySum > str + strPenaltySum) {
                abilityMod = dex;
                explain += `\nDexterity Modifier (Finesse): ${ SignNumber(abilityMod) }`;
                isDexUsed = true;
            } else if (weapon.dexterityBased) {
                abilityMod = dex;
                explain += `\nDexterity Modifier (Dexterity-based): ${ SignNumber(abilityMod) }`;
                isDexUsed = true;
            } else {
                abilityMod = str;
                explain += `\nStrength Modifier: ${ SignNumber(abilityMod) }`;
                isStrUsed = true;
            }
        }

        //Add up all modifiers before effects and item bonus
        let attackResult = charLevelBonus + skillLevel + abilityMod;
        let abilityName = '';

        if (isStrUsed) {
            abilityName = 'Strength';
        }

        if (isDexUsed) {
            abilityName = 'Dexterity';
        }

        const prof = this._weaponPropertiesService.effectiveProficiency(weapon, { creature, charLevel });
        //Create names list for effects
        const effectsListAttackRolls =
            attackEffectPhrases(
                weapon,
                'Attack Rolls',
                prof,
                range,
                traits,
                this._weaponPropertiesService.isFavoredWeapon(weapon, creature),
            )
                .concat([
                    weapon.name,
                    'Attack Rolls',
                    'All Checks and DCs',
                    //"Strength-based Checks and DCs", "Dexterity-based Checks and DCs"
                    `${ abilityName }-based Checks and DCs`,
                    //"Strength-based Attack Rolls", "Dexterity-based Attack Rolls"
                    `${ abilityName }-based Attack Rolls`,
                    //"Untrained Attack Rolls", "Expert Attack Rolls"
                    `${ SkillLevelName(skillLevel) } Attack Rolls`,
                ]);
        //For any activated traits of weapon weapon, check if any effects on Attack apply. These need to be evaluated in the Trait class.
        const traitEffects: Array<Effect> = [];

        weapon.activatedTraitsActivations().forEach(activation => {
            const realTrait = this._traitsDataService.traits(activation.trait)[0];

            traitEffects.push(...realTrait.objectBoundEffects(activation, ['Attack']));
        });
        //Add absolute effects
        this._effectsService.reduceEffectsByType(
            traitEffects
                .filter(effect => effect.setValue)
                .concat(this._effectsService.absoluteEffectsOnThese(creature, effectsListAttackRolls)),
            { absolutes: true },
        )
            .forEach(effect => {
                if (effect.show) {
                    absolutes.push(
                        Object.assign(
                            new Effect(),
                            { value: 0, setValue: effect.setValue, source: effect.source, penalty: false, type: effect.type },
                        ),
                    );
                }

                attackResult = parseInt(effect.setValue, 10);
                explain = `${ effect.source }: ${ effect.setValue }`;
            });

        let effectsSum = 0;
        //Add relative effects, including potency bonus and shoddy penalty
        //Generate potency bonus
        const potencyRune: number = runeSource.fundamentalRunes.effectivePotency();
        const calculatedEffects: Array<Effect> = [];

        if (potencyRune) {
            let source = 'Potency';

            //If you're getting the potency because of another item (like Doubling Rings), name it here
            if (runeSource.reason) {
                source = `Potency (${ runeSource.reason.effectiveName() })`;
            }

            calculatedEffects.push(
                Object.assign(
                    new Effect(potencyRune.toString()),
                    { creature: creature.type, type: 'item', target: weapon.name, source, apply: true, show: false },
                ),
            );
        }

        if (runeSource.fundamentalRunes.battleforged) {
            let source = 'Battleforged';

            //If you're getting the battleforged bonus because of another item (like Handwraps of Mighty Blows), name it here
            if (runeSource.reason) {
                source = `Battleforged (${ runeSource.reason.effectiveName() })`;
            }

            calculatedEffects.push(
                Object.assign(
                    new Effect('+1'),
                    { creature: creature.type, type: 'item', target: weapon.name, source, apply: true, show: false },
                ),
            );
        }

        //Powerful Fist ignores the nonlethal penalty on unarmed attacks.
        let hasPowerfulFist = false;

        if (weapon.prof === WeaponProficiencies.Unarmed) {
            const character = this._characterService.character;

            if (this._characterFeatsService.characterFeatsTaken(0, character.level, { featName: 'Powerful Fist' }).length) {
                hasPowerfulFist = true;
            }
        }

        //Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
        if ((weapon.$shoddy === ShoddyPenalties.NotShoddy) && weapon.shoddy) {
            explain += '\nShoddy (canceled by Junk Tinker): -0';
        } else if (weapon.$shoddy) {
            calculatedEffects.push(
                Object.assign(
                    new Effect(`${ ShoddyPenalties.Shoddy }`),
                    {
                        creature: creature.type,
                        type: 'item',
                        target: weapon.name,
                        source: 'Shoddy',
                        penalty: true,
                        apply: true,
                        show: false,
                    },
                ),
            );
        }

        // Because of the Potency and Shoddy Effects, we need to filter the types a second time,
        // even though get_RelativesOnThese comes pre-filtered.
        this._effectsService.reduceEffectsByType(
            calculatedEffects
                .concat(
                    traitEffects.filter(effect => effect.value !== '0'),
                    this._effectsService.relativeEffectsOnThese(creature, effectsListAttackRolls),
                ),
        )
            .forEach(effect => {
                //Powerful Fist ignores the nonlethal penalty on unarmed attacks.
                if (hasPowerfulFist && effect.source === 'conditional, Nonlethal') {
                    explain += '\nNonlethal (cancelled by Powerful Fist)';
                } else {
                    if (effect.show) {
                        if (parseInt(effect.value, 10) < 0) {
                            penalties.push(
                                Object.assign(
                                    new Effect(effect.value),
                                    {
                                        target: effect.target,
                                        source: effect.source,
                                        penalty: true,
                                        type: effect.type,
                                        apply: false,
                                        show: false,
                                    },
                                ),
                            );
                        } else {
                            bonuses.push(
                                Object.assign(
                                    new Effect(effect.value),
                                    {
                                        target: effect.target,
                                        source: effect.source,
                                        penalty: false,
                                        type: effect.type,
                                        apply: true,
                                        show: false,
                                    },
                                ),
                            );
                        }
                    }

                    effectsSum += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }${ parseInt(effect.value, 10) }`;
                }
            });
        //Add up all modifiers and return the attack bonus for weapon attack
        attackResult += effectsSum;
        explain = explain.trim();

        return { range, attackResult, explain, effects: penalties.concat(bonuses).concat(absolutes), penalties, bonuses, absolutes };
    }

}

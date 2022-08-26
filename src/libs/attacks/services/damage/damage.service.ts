/* eslint-disable complexity */
//TO-DO: partition the damage function into small steps
import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { Oil } from 'src/app/classes/Oil';
import { Specialization } from 'src/app/classes/Specialization';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { Weapon } from 'src/app/classes/Weapon';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { DiceSizes, DiceSizeBaseStep } from 'src/libs/shared/definitions/diceSizes';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { SkillLevelName } from 'src/libs/shared/util/skillUtils';
import { attackEffectPhrases } from '../../util/attackEffectPhrases';
import { attackRuneSource } from '../../util/attackRuneSource';
import { DamageResult } from '../attacks/attacks.service';
import { ItemSpecializationsDataService } from 'src/app/core/services/data/item-specializations-data.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';

@Injectable({
    providedIn: 'root',
})
export class DamageService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _itemSpecializationsDataService: ItemSpecializationsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    /**
     * Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
     *
     * Returns a string in the form of "1d6+5 B\n+1d6 Fire".
     *
     * A weapon with no dice and no extra damage returns a damage of "0".
     */
    public damage(
        weapon: Weapon,
        creature: Character | AnimalCompanion,
        range: string,
    ): DamageResult {
        if (!weapon.dicenum && !weapon.dicesize && !weapon.extraDamage) {
            return { damageResult: '0', explain: '', penalties: [], bonuses: [], absolutes: [] };
        }

        let diceExplain = `Base dice: ${ weapon.dicenum ? `${ weapon.dicenum }d` : '' }${ weapon.dicesize }`;
        let bonusExplain = '';
        const str = this._abilityValuesService.mod('Strength', creature).result;
        const dex = this._abilityValuesService.mod('Dexterity', creature).result;
        const penalties: Array<Effect> = [];
        const bonuses: Array<Effect> = [];
        const absolutes: Array<Effect> = [];
        const prof = this._weaponPropertiesService.effectiveProficiency(weapon, { creature });
        const traits = weapon.$traits;
        //Apply any mechanism that copy runes from another item, like Handwraps of Mighty Blows or Doubling Rings.
        //We set runeSource to the respective item and use it whenever runes are concerned.
        const runeSource = attackRuneSource(weapon, creature, range);
        const isFavoredWeapon = this._weaponPropertiesService.isFavoredWeapon(weapon, creature);
        const effectPhrases = (phrase: string): Array<string> =>
            attackEffectPhrases(weapon, phrase, prof, range, traits, isFavoredWeapon)
                .concat([
                    `Damage ${ phrase }`,
                ]);
        //Determine the dice Number - Dice Number Multiplier first, then Dice Number (Striking included)
        let dicenum = weapon.dicenum;

        if (dicenum) {
            let dicenumMultiplier = 1;
            const effectPhrasesDiceNumberMult = effectPhrases('Dice Number Multiplier');

            this._creatureEffectsService.absoluteEffectsOnThese(creature, effectPhrasesDiceNumberMult).forEach(effect => {
                dicenumMultiplier = parseInt(effect.setValue, 10);
                diceExplain += `\n${ effect.source }: Dice number multiplier ${ dicenumMultiplier }`;
            });
            this._creatureEffectsService.relativeEffectsOnThese(creature, effectPhrasesDiceNumberMult).forEach(effect => {
                dicenumMultiplier += parseInt(effect.value, 10);
                diceExplain +=
                    `\n${ effect.source }: Dice number multiplier ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }`
                    + `${ parseInt(effect.value, 10) }`;
            });
            dicenum *= dicenumMultiplier;

            const calculatedAbsoluteDiceNumEffects: Array<Effect> = [];
            const effectPhrasesDiceNumber = effectPhrases('Dice Number');

            //Add the striking rune or oil of potency effect of the runeSource.
            //Only apply and explain Striking if it's actually better than your multiplied dice number.
            if (runeSource.fundamentalRunes.effectiveStriking() + 1 > dicenum) {
                let source = runeSource.fundamentalRunes.strikingTitle(runeSource.fundamentalRunes.effectiveStriking());

                //If you're getting the striking effect because of another item (like Doubling Rings), name it here
                if (runeSource.reason) {
                    source += ` (${ runeSource.reason.effectiveName() })`;
                }

                calculatedAbsoluteDiceNumEffects.push(
                    Object.assign(
                        new Effect(),
                        {
                            creature: creature.type,
                            type: 'untyped',
                            target: `${ weapon.name } Dice Number`,
                            setValue: (1 + runeSource.fundamentalRunes.effectiveStriking()).toString(),
                            source,
                            apply: true,
                            show: false,
                        },
                    ),
                );
            }

            // For any activated traits of this weapon, check if any effects on Dice Number apply.
            // These need to be calculated in the effects service.
            const traitEffects = [];

            weapon.activatedTraitsActivations().forEach(activation => {
                const realTrait = this._traitsDataService.traits(activation.trait)[0];

                traitEffects.push(...realTrait.objectBoundEffects(activation, ['Dice Number']));
            });
            this._creatureEffectsService.reduceEffectsByType(
                calculatedAbsoluteDiceNumEffects
                    .concat(
                        traitEffects.filter(effect => effect.setValue),
                        this._creatureEffectsService.absoluteEffectsOnThese(creature, effectPhrasesDiceNumber),
                    ),
                { absolutes: true },
            )
                .forEach(effect => {
                    dicenum = parseInt(effect.setValue, 10);
                    diceExplain += `\n${ effect.source }: Dice number ${ dicenum }`;
                });

            const calculatedRelativeDiceNumEffects: Array<Effect> = [];

            //Diamond Fists adds the forceful trait to your unarmed attacks, but if one already has the trait, it gains one damage die.
            if (weapon.prof === WeaponProficiencies.Unarmed) {
                const character = CreatureService.character;

                if (
                    this._characterFeatsService.characterFeatsTaken(0, character.level, { featName: 'Diamond Fists' }).length &&
                    weapon.traits.includes('Forceful')
                ) {
                    calculatedRelativeDiceNumEffects.push(
                        Object.assign(
                            new Effect('+1'),
                            {
                                creature: creature.type,
                                type: 'untyped',
                                target: `${ weapon.name } Dice Number`,
                                source: 'Diamond Fists',
                                apply: true,
                                show: false,
                            },
                        ),
                    );
                }
            }

            this._creatureEffectsService.reduceEffectsByType(
                calculatedRelativeDiceNumEffects
                    .concat(traitEffects.filter(effect => effect.value !== '0'))
                    .concat(this._creatureEffectsService.relativeEffectsOnThese(creature, effectPhrasesDiceNumber)),
            )
                .forEach(effect => {
                    dicenum += parseInt(effect.value, 10);
                    diceExplain +=
                        `\n${ effect.source }: Dice number ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }${ parseInt(effect.value, 10) }`;
                });
        }

        //Determine the dice size.
        let dicesize = weapon.dicesize;

        if (dicesize) {
            const calculatedAbsoluteDiceSizeEffects: Array<Effect> = [];

            // Champions get increased dice size via Deific Weapon for unarmed attacks with d4 damage
            // or simple weapons as long as they are their deity's favored weapon.
            if (
                (
                    (
                        dicesize === DiceSizes.D4 &&
                        weapon.prof === WeaponProficiencies.Unarmed
                    ) ||
                    weapon.prof === WeaponProficiencies.Simple
                ) &&
                this._characterFeatsService.characterHasFeat('Deific Weapon')
            ) {
                if (this._weaponPropertiesService.isFavoredWeapon(weapon, creature)) {
                    const newDicesize = Math.max(Math.min(dicesize + DiceSizeBaseStep, DiceSizes.D12), DiceSizes.D6);

                    if (newDicesize > dicesize) {
                        calculatedAbsoluteDiceSizeEffects.push(
                            Object.assign(
                                new Effect(),
                                {
                                    creature: creature.type,
                                    type: 'untyped',
                                    target: `${ weapon.name } Dice Size`,
                                    setValue: newDicesize.toString(),
                                    source: 'Deific Weapon',
                                    apply: true,
                                    show: false,
                                },
                            ),
                        );
                    }
                }
            }

            // Clerics get increased dice size via Deadly Simplicity for unarmed attacks with less than d6 damage
            // or simple weapons as long as they are their deity's favored weapon.
            if (
                (
                    (
                        dicesize < DiceSizes.D6 &&
                        weapon.prof === WeaponProficiencies.Unarmed
                    ) ||
                    weapon.prof === WeaponProficiencies.Simple
                ) &&
                this._characterFeatsService.characterHasFeat('Deadly Simplicity')
            ) {
                if (this._weaponPropertiesService.isFavoredWeapon(weapon, creature)) {
                    let newDicesize = Math.max(Math.min(dicesize + DiceSizeBaseStep, DiceSizes.D12), DiceSizes.D6);

                    if (dicesize < DiceSizes.D6 && weapon.prof === WeaponProficiencies.Unarmed) {
                        newDicesize = DiceSizes.D6;
                    }

                    if (newDicesize > dicesize) {
                        calculatedAbsoluteDiceSizeEffects.push(
                            Object.assign(
                                new Effect(),
                                {
                                    creature: creature.type,
                                    type: 'untyped',
                                    target: `${ weapon.name } Dice Size`,
                                    setValue: newDicesize.toString(),
                                    source: 'Deadly Simplicity',
                                    apply: true,
                                    show: false,
                                },
                            ),
                        );
                    }
                }
            }

            // For any activated traits of this weapon, check if any effects on Dice Size apply.
            // These need to be calculated in the effects service.
            const traitEffects = [];

            weapon.activatedTraitsActivations().forEach(activation => {
                const realTrait = this._traitsDataService.traits(activation.trait)[0];

                traitEffects.push(...realTrait.objectBoundEffects(activation, ['Dice Size']));
            });

            //Apply dice size effects.
            const effectPhrasesDiceSize = effectPhrases('Dice Size');

            this._creatureEffectsService.reduceEffectsByType(
                calculatedAbsoluteDiceSizeEffects
                    .concat(traitEffects.filter(effect => effect.setValue))
                    .concat(this._creatureEffectsService.absoluteEffectsOnThese(creature, effectPhrasesDiceSize)),
                { absolutes: true })
                .forEach(effect => {
                    dicesize = parseInt(effect.setValue, 10);
                    diceExplain += `\n${ effect.source }: Dice size d${ dicesize }`;
                });
            this._creatureEffectsService.reduceEffectsByType(
                traitEffects.filter(effect => effect.value !== '0')
                    .concat(this._creatureEffectsService.relativeEffectsOnThese(creature, effectPhrasesDiceSize)),
            )
                .forEach(effect => {
                    dicesize += parseInt(effect.value, 10);
                    //Don't raise dice size over 12.
                    dicesize = Math.min(DiceSizes.D12, dicesize);
                    diceExplain += `\n${ effect.source }: Dice size d${ dicesize }`;
                });
        }

        // Get the basic "#d#" string from the weapon's dice values,
        // unless dicenum is 0 or null (for instance some weapons deal exactly 1 base damage, which is represented by 0d1).
        // In that case, add the damage to the damage bonus and ignore the #d# string.
        let baseDice = '';
        let dmgBonus = 0;

        if (dicenum) {
            baseDice = `${ dicenum }d${ dicesize }`;
        } else {
            if (dicesize) {
                dmgBonus += dicesize;
            }
        }

        //Decide whether this weapon uses strength or dexterity (modifier, bonuses and penalties).
        const calculatedDamageEffects: Array<Effect> = [];
        let isStrUsed = false;
        let isDexUsed = false;
        let abilityReason = '';

        //Weapons with the Splash trait do not add your Strength modifier (and presumably not your Dexterity modifier, either).
        if (!traits.includes('Splash')) {
            let abilityMod = 0;

            //First, calculate dexterity and strength penalties to see which would be more beneficial. They are not immediately applied.
            //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
            if (range === 'ranged') {
                if (traits.includes('Propulsive')) {
                    const half = .5;

                    if (str > 0) {
                        abilityMod = Math.floor(str * half);
                        abilityReason = 'Propulsive';
                        isStrUsed = true;
                    } else if (str < 0) {
                        abilityMod = str;
                        abilityReason = 'Propulsive';
                        isStrUsed = true;
                    }
                } else if (traits.some(trait => trait.includes('Thrown'))) {
                    abilityMod = str;
                    abilityReason += 'Thrown';
                    isStrUsed = true;
                }
            } else {
                //If the weapon is Finesse and you have the Thief Racket, you apply your Dexterity modifier to damage if it is higher.
                if (traits.includes('Finesse') &&
                    creature.isCharacter() &&
                    this._characterFeatsService.characterFeatsTaken(1, creature.level, { featName: 'Thief Racket' }).length) {
                    //Check if dex or str would give you more damage by comparing your modifiers and any penalties and bonuses.
                    //The Enfeebled condition affects all Strength damage
                    const strEffects = this._creatureEffectsService.relativeEffectsOnThis(creature, 'Strength-based Checks and DCs');
                    let strPenaltySum = 0;

                    strEffects.forEach(effect => {
                        strPenaltySum += parseInt(effect.value, 10);
                    });

                    //The Clumsy condition affects all Dexterity damage
                    const dexEffects = this._creatureEffectsService.relativeEffectsOnThis(creature, 'Dexterity-based Checks and DCs');
                    let dexPenaltySum = 0;

                    dexEffects.forEach(effect => {
                        dexPenaltySum += parseInt(effect.value, 10);
                    });

                    if ((dex + dexPenaltySum) > (str + strPenaltySum)) {
                        abilityMod = dex;
                        abilityReason += 'Thief';
                        isDexUsed = true;
                    } else {
                        abilityMod = str;
                        isStrUsed = true;
                    }
                } else {
                    abilityMod = str;
                    isStrUsed = true;
                }
            }

            if (abilityMod) {
                let abilitySource = '';

                if (isStrUsed) {
                    abilitySource = 'Strength Modifier';
                }

                if (isDexUsed) {
                    abilitySource = 'Dexterity Modifier';
                }

                if (abilityReason) {
                    abilitySource += ` (${ abilityReason })`;
                }

                calculatedDamageEffects.push(
                    Object.assign(
                        new Effect(abilityMod.toString()),
                        {
                            creature: creature.type,
                            type: 'untyped',
                            target: `${ weapon.name } Damage`,
                            source: abilitySource,
                            apply: true,
                            show: false,
                        },
                    ),
                );
            }
        }

        //Mature and Specialized Companions add extra Damage to their attacks.
        if (creature.isAnimalCompanion()) {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDamage) {
                    let companionSource = '';
                    let companionMod: number = level.extraDamage;

                    companionSource = `${ level.name } Animal Companion`;

                    if (creature.class.specializations.length) {
                        const double = 2;

                        companionMod *= double;
                        companionSource = 'Specialized Animal Companion';
                    }

                    calculatedDamageEffects.push(
                        Object.assign(
                            new Effect(companionMod.toString()),
                            {
                                creature: creature.type,
                                type: 'untyped',
                                target: `${ weapon.name } Damage`,
                                source: companionSource,
                                apply: true,
                                show: false,
                            },
                        ),
                    );
                }
            });
        }

        //Emblazon Armament on a weapon adds a +1 status bonus to damage rolls if the deity matches.
        if (creature.isCharacter()) {
            if (weapon.$emblazonArmament) {
                weapon.emblazonArmament
                    .filter(ea => ea.type === 'emblazonArmament')
                    .forEach(() => {
                        calculatedDamageEffects.push(
                            Object.assign(
                                new Effect('+1'),
                                {
                                    creature: creature.type,
                                    type: 'status',
                                    target: `${ weapon.name } Damage`,
                                    source: 'Emblazon Armament',
                                    apply: true,
                                    show: false,
                                },
                            ),
                        );
                    });
            }
        }

        const profLevel = this._weaponPropertiesService.profLevel(weapon, creature, runeSource.propertyRunes);
        const effectPhrasesDamage =
            effectPhrases('Damage')
                .concat(effectPhrases('Damage Rolls'));
        const agile = traits.includes('Agile') ? 'Agile' : 'Non-Agile';

        //"Agile/Non-Agile Large Melee Weapon Damage"
        if (weapon.large) {
            effectPhrasesDamage.push(
                `${ agile } Large ${ range } Weapon Damage`,
                `${ agile } Large ${ range } Weapon Damage Rolls`,
            );
        }

        //"Agile/Non-Agile Melee Damage"
        effectPhrasesDamage.push(
            `${ agile } ${ range } Damage`,
            `${ agile } ${ range } Damage Rolls`,
        );

        if ((range === 'ranged') && weapon.traits.some(trait => trait.includes('Thrown'))) {
            //"Agile/Non-Agile Thrown Large Weapon Damage"
            if (weapon.large) {
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

        this._creatureEffectsService.absoluteEffectsOnThese(creature, effectPhrasesDamage)
            .forEach(effect => {
                if (effect.show) {
                    absolutes.push(
                        Object.assign(
                            new Effect(),
                            { value: 0, setValue: effect.setValue, source: effect.source, penalty: false },
                        ),
                    );
                }

                dmgBonus = parseInt(effect.setValue, 10);
                bonusExplain = `\n${ effect.source }: Bonus damage ${ parseInt(effect.setValue, 10) }`;
            });

        if (!this._creatureEffectsService.effectsOnThis(creature, `Ignore Bonus Damage on ${ weapon.name }`).length) {
            let effectBonus = 0;
            let abilityName = '';

            if (isStrUsed) {
                abilityName = 'Strength';
            }

            if (isDexUsed) {
                abilityName = 'Dexterity';
            }

            //"Strength-based Checks and DCs"
            effectPhrasesDamage.push(`${ abilityName }-based Checks and DCs`);

            //Proficiency-based damage
            const profLevelName = SkillLevelName(profLevel) || '';

            if (profLevelName) {
                effectPhrasesDamage.push(
                    `${ profLevelName } Proficiency Attack Damage`,
                    `${ profLevelName } Proficiency Attack Damage Rolls`,
                    `Trained Proficiency ${ weapon.name } Damage`,
                    `Trained Proficiency ${ weapon.name } Damage Rolls`,
                );
            }

            // Pre-create Effects based on "Damage per Die" effects.
            // For any activated traits of this weapon, check if any effects on Dice Size apply.
            // These need to be calculated in the effects service.
            const traitEffects = [];

            weapon.activatedTraitsActivations().forEach(activation => {
                const realTrait = this._traitsDataService.traits(activation.trait)[0];

                traitEffects.push(...realTrait.objectBoundEffects(activation, ['Damage per Die']));
            });

            const perDieList: Array<string> = [];

            if (weapon.prof === 'Unarmed Attacks') {
                perDieList.push('Unarmed Damage per Die');
            } else {
                perDieList.push('Weapon Damage per Die');
            }

            traits.forEach(trait => {
                if (trait.includes(' ft')) {
                    perDieList.push(`${ trait.split(' ')[0] } Damage per Die`);
                } else {
                    perDieList.push(`${ trait } Damage per Die`);
                }
            });
            // All "...Damage per Die" effects are converted to just "...Damage" (by multiplying with the dice number)
            // and then re-processed with the rest of the damage effects.
            traitEffects.filter(effect => effect.value !== '0')
                .concat(this._creatureEffectsService.relativeEffectsOnThese(creature, perDieList))
                .forEach(effect => {
                    const effectValue = parseInt(effect.value, 10) * dicenum;
                    const newEffect = effect.clone();

                    newEffect.target = newEffect.target.replace(' per Die', '');
                    newEffect.value = effectValue.toString();
                    calculatedDamageEffects.push(newEffect);
                });
            //Now collect and apply the type-filtered effects on this weapon's damage, including the pregenerated ones.
            this._creatureEffectsService.reduceEffectsByType(
                calculatedDamageEffects
                    .concat(this._creatureEffectsService.relativeEffectsOnThese(creature, effectPhrasesDamage)),
            )
                .forEach(effect => {
                    if (effect.show) {
                        if (parseInt(effect.value, 10) < 0) {
                            penalties.push(
                                Object.assign(
                                    new Effect(),
                                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: true },
                                ),
                            );
                        } else {
                            bonuses.push(
                                Object.assign(
                                    new Effect(),
                                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: false },
                                ),
                            );
                        }
                    }

                    effectBonus += parseInt(effect.value, 10);
                    bonusExplain +=
                        `\n${ effect.source }: Damage ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }${ parseInt(effect.value, 10) }`;
                });
            dmgBonus += effectBonus;
        }

        //Concatenate the strings for a readable damage output
        let dmgResult = baseDice;

        if (dmgBonus > 0) {
            if (baseDice) {
                dmgResult += ' + ';
            }

            dmgResult += dmgBonus;
        } else if (dmgBonus < 0) {
            if (baseDice) {
                dmgResult += ' - ';
            }

            dmgResult += (dmgBonus * -1);
        }

        let dmgType = weapon.dmgType;

        if (dmgType) {
            // If any versatile traits have been added to the weapon's original traits,
            // also add the additional damage type to its damage type.
            traits.filter(trait => trait.toLowerCase().includes('versatile') && !weapon.traits.includes(trait)).forEach(trait => {
                const type = trait.split(' ')[1];

                if (type) {
                    dmgType += `/${ type }`;
                }
            });
            dmgResult += ` ${ dmgType }`;
        }

        dmgResult +=
            ` ${ this._effectiveExtraDamage(weapon, creature, range, prof, traits) }`;

        const explain = (`${ diceExplain.trim() }\n${ bonusExplain.trim() }`).trim();

        return { damageResult: dmgResult, explain, penalties, bonuses, absolutes };
    }

    public critSpecialization(weapon: Weapon, creature: Creature, range: string): Array<Specialization> {
        const SpecializationGains: Array<SpecializationGain> = [];
        const specializations: Array<Specialization> = [];
        const prof = this._weaponPropertiesService.effectiveProficiency(weapon, { creature: (creature as AnimalCompanion | Character) });

        if (creature.isCharacter() && weapon.group) {
            const runeSource = attackRuneSource(weapon, creature, range);
            const skillLevel = this._weaponPropertiesService.profLevel(weapon, creature, runeSource.propertyRunes);

            this._characterFeatsService.characterFeatsAndFeatures()
                .filter(feat =>
                    feat.gainSpecialization.length &&
                    this._characterFeatsService.characterHasFeat(feat.name),
                )
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (!spec.minLevel || creature.level >= spec.minLevel) &&
                        (!spec.bladeAlly || (weapon.bladeAlly || runeSource.propertyRunes.bladeAlly)) &&
                        (!spec.favoredWeapon || this._weaponPropertiesService.isFavoredWeapon(weapon, creature)) &&
                        (!spec.group || (weapon.group && spec.group.includes(weapon.group))) &&
                        (!spec.range || (range && spec.range.includes(range))) &&
                        (
                            !spec.name ||
                            (
                                (weapon.name && spec.name.includes(weapon.name)) ||
                                (weapon.weaponBase && spec.name.includes(weapon.weaponBase))
                            )
                        ) &&
                        (!spec.trait || weapon.traits.some(trait => spec.trait.includes(trait))) &&
                        (!spec.proficiency || (prof && spec.proficiency.includes(prof))) &&
                        (!spec.skillLevel || skillLevel >= spec.skillLevel) &&
                        (
                            !spec.featreq ||
                            this._characterFeatsService.characterHasFeat(spec.featreq)
                        ),
                    ));
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Array<Specialization> =
                    this._itemSpecializationsDataService.specializations(weapon.group)
                        .map(spec => Object.assign(new Specialization(), spec).recast());

                specs.forEach(spec => {
                    if (critSpec.condition) {
                        spec.desc = `(${ critSpec.condition }) ${ spec.desc }`;
                    }

                    if (!specializations.some(existingspec => JSON.stringify(existingspec) === JSON.stringify(spec))) {
                        specializations.push(spec);
                    }
                });
            });
        }

        return specializations;
    }

    private _effectiveExtraDamage(
        weapon: Weapon,
        creature: Character | AnimalCompanion,
        range: string,
        prof: string,
        traits: Array<string>,
    ): string {
        let extraDamage = '';

        if (weapon.extraDamage) {
            extraDamage += `\n${ weapon.extraDamage }`;
        }

        const runeSource = attackRuneSource(weapon, creature, range);

        runeSource.propertyRunes.propertyRunes
            .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
            .forEach((weaponRune: WeaponRune) => {
                extraDamage += `\n${ weaponRune.extraDamage }`;
            });
        weapon.oilsApplied
            .filter((oil: Oil) => oil.runeEffect && oil.runeEffect.extraDamage)
            .forEach((oil: Oil) => {
                extraDamage += `\n${ oil.runeEffect.extraDamage }`;
            });

        if (runeSource.propertyRunes.bladeAlly) {
            runeSource.propertyRunes.bladeAllyRunes
                .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
                .forEach((weaponRune: WeaponRune) => {
                    extraDamage += `\n${ weaponRune.extraDamage }`;
                });
        }

        //Emblazon Energy on a weapon adds 1d4 damage of the chosen type if the deity matches.
        if (creature.isCharacter()) {
            if (weapon.$emblazonEnergy) {
                weapon.emblazonArmament.filter(ea => ea.type === 'emblazonEnergy').forEach(ea => {
                    let eaDmg = '+1d4 ';
                    const type = ea.choice;

                    creature.class.spellCasting.find(casting => casting.source === 'Domain Spells')?.spellChoices.forEach(choice => {
                        choice.spells.forEach(spell => {
                            if (this._spellsDataService.spellFromName(spell.name)?.traits.includes(type)) {
                                eaDmg = '+1d6 ';
                            }
                        });
                    });
                    extraDamage += `\n${ eaDmg }${ type }`;
                });
            }
        }

        //Add any damage from effects. These effects must be toggle and have the damage as a string in their title.
        const effectPhrasesExtraDamage =
            attackEffectPhrases(
                weapon,
                'Extra Damage',
                prof,
                range,
                traits,
                this._weaponPropertiesService.isFavoredWeapon(weapon, creature),
            );
        const agile = traits.includes('Agile') ? 'Agile' : 'Non-Agile';

        //"Agile/Non-Agile Large Melee Weapon Extra Damage"
        if (weapon.large) {
            effectPhrasesExtraDamage.push(`${ agile } Large ${ range } Weapon Extra Damage`);
        }

        //"Agile/Non-Agile Melee Extra Damage"
        effectPhrasesExtraDamage.push(`${ agile } ${ range } Extra Damage`);

        if ((range === 'ranged') && weapon.traits.some(trait => trait.includes('Thrown'))) {
            //"Agile/Non-Agile Thrown Large Weapon ExtraDamage"
            if (weapon.large) {
                effectPhrasesExtraDamage.push(
                    `${ agile } Thrown Large Weapon Extra Damage`,
                );
            }

            //"Agile/Non-Agile Thrown Weapon Damage"
            effectPhrasesExtraDamage.push(`${ agile } Thrown Weapon Extra Damage`);
        }

        this._creatureEffectsService.toggledEffectsOnThese(creature, effectPhrasesExtraDamage).filter(effect => effect.title)
            .forEach(effect => {
                extraDamage += `\n${ !['+', '-'].includes(effect.title.substr(0, 1)) ? '+' : '' }${ effect.title }`;
            });
        extraDamage = extraDamage.split('+').map(part => part.trim())
            .join(' + ');
        extraDamage = extraDamage.split('-').map(part => part.trim())
            .join(' - ');

        return extraDamage;
    }

}

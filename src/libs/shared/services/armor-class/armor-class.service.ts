/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, map, combineLatest, switchMap, of } from 'rxjs';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect, AbsoluteEffect, RelativeEffect } from 'src/app/classes/effects/effect';
import { Shield } from 'src/app/classes/items/shield';
import { BonusTypes } from '../../definitions/bonus-types';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { ArmorPropertiesService } from '../armor-properties/armor-properties.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { CreatureEquipmentService } from '../creature-equipment/creature-equipment.service';
import { CreatureService } from '../creature/creature.service';
import { RecastService } from '../recast/recast.service';
import { RefreshService } from '../refresh/refresh.service';

export interface ACForDisplay {
    bonuses$: Observable<boolean>;
    penalties$: Observable<boolean>;
    absolutes$: Observable<boolean>;
    value$: Observable<{ result: number; explain: string; effects: Array<Effect> }>;
}

export enum CoverTypes {
    NoCover = 0,
    LesserCover = 1,
    Cover = 2,
    GreaterCover = 4
}

const namesList = [
    'AC',
    'All Checks and DCs',
    'Dexterity-based Checks and DCs',
];

@Injectable({
    providedIn: 'root',
})
export class ArmorClassService {

    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _refreshService: RefreshService,
    ) { }

    public setCover(
        creature: Creature,
        cover: number,
        shield?: Shield,
    ): void {
        const conditions: Array<ConditionGain> =
            this._creatureConditionsService
                .currentCreatureConditions(creature, {}, { readonly: true })
                .filter(gain => gain.name === 'Cover' && gain.source === 'Quick Status');
        const lesserCover = conditions.find(gain => gain.name === 'Cover' && gain.choice === 'Lesser');
        const standardCover = conditions.find(gain => gain.name === 'Cover' && gain.choice === 'Standard');
        const greaterCover = conditions.find(gain => gain.name === 'Cover' && gain.choice === 'Greater');
        let coverChoice = '';

        switch (cover) {
            case CoverTypes.NoCover:
                if (shield) {
                    shield.takingCover = false;
                }

                break;
            case CoverTypes.LesserCover:
                if (!lesserCover) {
                    coverChoice = 'Lesser';
                }

                break;
            case CoverTypes.Cover:
                if (!standardCover) {
                    coverChoice = 'Standard';
                }

                break;
            case CoverTypes.GreaterCover:
                if (shield) {
                    shield.takingCover = true;
                }

                if (!greaterCover) {
                    coverChoice = 'Greater';
                }

                break;
            default:
                if (shield) {
                    shield.takingCover = false;
                }
        }

        if (lesserCover && cover !== CoverTypes.LesserCover) {
            this._creatureConditionsService.removeCondition(creature, lesserCover, false);
        }

        if (standardCover && cover !== CoverTypes.Cover) {
            this._creatureConditionsService.removeCondition(creature, standardCover, false);
        }

        if (greaterCover && cover !== CoverTypes.GreaterCover) {
            this._creatureConditionsService.removeCondition(creature, greaterCover, false);
        }

        if (coverChoice) {
            const newCondition: ConditionGain =
                ConditionGain.from(
                    { name: 'Cover', choice: coverChoice, source: 'Quick Status', duration: -1 },
                    RecastService.recastFns,
                );

            this._creatureConditionsService.addCondition(creature, newCondition, {}, { noReload: true });
        }

        this._refreshService.processPreparedChanges();
    }
    public collectForDisplay(
        creature: Creature,
    ): ACForDisplay {
        const armorCreature =
            creature.isFamiliar() ? CreatureService.character : creature;

        return {
            bonuses$: this._bonuses$(creature),
            penalties$: this._penalties$(creature),
            absolutes$: this._absolutes$(armorCreature)
                .pipe(
                    map(absolutes => !!absolutes.length),
                ),
            value$: this._value$(creature),
        };
    }

    private _absolutes$(creature: Creature): Observable<Array<AbsoluteEffect>> {
        return this._creatureEffectsService.absoluteEffectsOnThese$(creature, namesList);
    }

    private _relatives$(creature: Creature): Observable<Array<RelativeEffect>> {
        const character = CreatureService.character;

        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature.isFamiliar()) {
            return combineLatest([
                this._creatureEffectsService.relativeEffectsOnThese$(character, namesList)
                    .pipe(
                        map(characterRelatives => characterRelatives
                            .filter(effect => ![BonusTypes.Circumstance, BonusTypes.Status].includes(effect.type)),
                        ),
                    ),
                this._creatureEffectsService.relativeEffectsOnThese$(
                    creature, namesList, { onlyOfTypes: [BonusTypes.Circumstance, BonusTypes.Status] },
                ),
            ])
                .pipe(
                    map(([characterRelatives, creatureRelatives]) => characterRelatives.concat(creatureRelatives)),
                );
        } else {
            return this._creatureEffectsService.relativeEffectsOnThese$(creature, namesList);
        }
    }

    private _bonuses$(creature: Creature): Observable<boolean> {
        if (creature.isFamiliar()) {
            return this._creatureEffectsService.doBonusEffectsExistOnThese$(
                creature, namesList, { onlyOfTypes: [BonusTypes.Circumstance, BonusTypes.Status] },
            );
        } else {
            return this._creatureEffectsService.doBonusEffectsExistOnThese$(creature, namesList);
        }
    }

    private _penalties$(creature: Creature): Observable<boolean> {
        //We need to copy show_PenaltiesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature.isFamiliar()) {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThese$(
                creature, namesList, { onlyOfTypes: [BonusTypes.Circumstance, BonusTypes.Status] },
            );
        } else {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThese$(creature, namesList);
        }
    }

    private _value$(
        creature: Creature,
    ): Observable<{ result: number; explain: string; effects: Array<Effect> }> {
        // Familiars calculate their AC based on the character, so if this creature is a familiar,
        // the character is used for the calculation.
        const armorCreature =
            creature.isFamiliar() ? CreatureService.character : creature;

        return combineLatest([
            this._absolutes$(armorCreature),
            this._relatives$(creature),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    //Get the bonus from the worn armor. This includes the basic 10
                    let basicBonus = 10;
                    let basicExplain = 'DC Basis: 10';

                    let isBaseArmorBonusSet = false;

                    //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
                    absolutes.forEach(effect => {
                        isBaseArmorBonusSet = true;
                        basicBonus = effect.setValueNumerical;
                        basicExplain = `${ effect.source }: ${ effect.setValue }`;
                    });

                    return { basicBonus, basicExplain, isBaseArmorBonusSet, absolutes, relatives: [...relatives] };
                }),
                switchMap(({ basicBonus, basicExplain, isBaseArmorBonusSet, absolutes, relatives }) =>
                    this._creatureEquipmentService.equippedCreatureArmor$(armorCreature)
                        .pipe(
                            switchMap(armors =>
                                (!isBaseArmorBonusSet && armors[0])
                                    ? combineLatest([
                                        CharacterFlatteningService.characterLevel$,
                                        // Get the profiency with either this armor or its category.
                                        this._armorPropertiesService.profLevel$(armors[0], armorCreature),
                                        this._abilityValuesService.mod$('Dexterity', armorCreature),
                                        armors[0].effectiveDexCap$(),
                                        this._creatureEffectsService.absoluteEffectsOnThis$(armorCreature, 'Dexterity Modifier Cap'),
                                        this._creatureEffectsService.relativeEffectsOnThis$(armorCreature, 'Dexterity Modifier Cap'),
                                        armors[0].effectiveACBonus$(),
                                        armors[0].effectiveShoddy$,
                                        armors[0].effectivePotency$(),
                                    ])
                                        .pipe(
                                            map(([
                                                charLevel,
                                                skillLevel,
                                                dexModifier,
                                                dexCap,
                                                dexCapAbsolutes,
                                                dexCapRelatives,
                                                armorItemBonus,
                                                shoddy,
                                                potency,
                                            ]) => {
                                                const armor = armors[0];
                                                const dex = dexModifier.result;
                                                const adHocRelatives = new Array<RelativeEffect>();
                                                let explain = basicExplain;

                                                let charLevelBonus = 0;

                                                if (skillLevel) {
                                                    explain += `\nProficiency: ${ skillLevel }`;
                                                    // Add character level if the character is trained or better
                                                    // with either the armor category or the armor itself
                                                    charLevelBonus = charLevel;
                                                    explain += `\nCharacter Level: ${ charLevelBonus }`;
                                                }

                                                dexCapAbsolutes.forEach(effect => {
                                                    // The dexterity modifier should only become worse through effects,
                                                    // unless it is removed entirely (by setting it to -1).
                                                    if (dexCap === -1 || effect.setValueNumerical < dexCap) {
                                                        dexCap = Math.max(0, effect.setValueNumerical);
                                                        explain += `\n${ effect.source }: Dexterity modifier cap ${ dexCap }`;
                                                    }
                                                });
                                                dexCapRelatives.forEach(effect => {
                                                    // The dexterity modifier should only become worse through effects, but no lower than 0.
                                                    if (effect.valueNumerical < 0) {
                                                        dexCap = Math.max(0, dexCap + effect.valueNumerical);
                                                        explain +=
                                                            `\n${ effect.source }: Dexterity modifier cap ${ effect.valueNumerical }`;
                                                    }
                                                });

                                                // Add the dexterity modifier up to the armor's dex cap, unless there is no cap.
                                                const dexBonus = (dexCap !== -1) ? Math.max(Math.min(dex, dexCap), 0) : dex;

                                                if (dexBonus || dex) {
                                                    if (dexCap !== -1 && dexCap < dex) {
                                                        explain += `\nDexterity Modifier (capped): ${ dexBonus }`;
                                                    } else {
                                                        explain += `\nDexterity Modifier: ${ dexBonus }`;
                                                    }
                                                }

                                                if (armorItemBonus) {
                                                    //Potency increases the armor bonus; it does not add a separate bonus on armors.
                                                    if (potency) {
                                                        armorItemBonus += potency;
                                                    }

                                                    adHocRelatives.push(
                                                        Effect.from({
                                                            value: armorItemBonus.toString(),
                                                            creature: armorCreature.type,
                                                            type: BonusTypes.Item,
                                                            target: 'AC',
                                                            source: `Armor bonus${ potency ? ` (+${ potency } Potency)` : '' }`,
                                                            applied: true,
                                                            displayed: false,
                                                        }),
                                                    );
                                                }

                                                if (armor?.battleforged) {
                                                    adHocRelatives.push(
                                                        Effect.from({
                                                            value: '+1',
                                                            creature: armorCreature.type,
                                                            type: BonusTypes.Item,
                                                            target: 'AC',
                                                            source: 'Battleforged',
                                                            applied: true,
                                                            displayed: true,
                                                        }),
                                                    );
                                                }

                                                // Shoddy items have a -2 item penalty to AC,
                                                // unless you have the Junk Tinker feat and have crafted the item yourself.
                                                // This is considered when effectiveShoddy$ is calculated.
                                                if (shoddy) {
                                                    adHocRelatives.push(
                                                        Effect.from({
                                                            value: '-2',
                                                            creature: armorCreature.type,
                                                            type: BonusTypes.Item,
                                                            target: 'AC',
                                                            source: 'Shoddy Armor',
                                                            penalty: true,
                                                            applied: true,
                                                            displayed: true,
                                                        }),
                                                    );
                                                }

                                                //Add up all modifiers and return the AC gained from this armor.
                                                const bonus = basicBonus + skillLevel + charLevelBonus + dexBonus;

                                                return { bonus, explain, absolutes, relatives: [...relatives, ...adHocRelatives] };
                                            }),
                                        )
                                    : of({ bonus: basicBonus, explain: basicExplain, absolutes, relatives })),
                        ),
                ),
                map(({ bonus, explain, absolutes, relatives }) => {
                    //Sum up the effects
                    let effectsSum = 0;

                    this._creatureEffectsService.reduceRelativesByType(relatives)
                        .forEach(effect => {
                            effectsSum += effect.valueNumerical;
                            explain += `\n${ effect.source }: ${ effect.value }`;
                        });

                    //Add up the armor bonus and all active effects and return the sum
                    const result: number = bonus + effectsSum;

                    const effects = new Array<Effect>()
                        .concat(absolutes)
                        .concat(relatives);

                    return { result, explain, effects };
                }),
            );
    }
}

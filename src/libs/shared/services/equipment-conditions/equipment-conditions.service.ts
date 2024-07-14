/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { switchMap, of, Observable, combineLatest, tap, take, map } from 'rxjs';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { WornItem } from 'src/app/classes/items/worn-item';
import { propMap$ } from '../../util/observableUtils';
import { stringEqualsCaseInsensitive } from '../../util/stringUtils';
import { BulkService } from '../bulk/bulk.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureService } from '../creature/creature.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { OnceEffectsService } from '../once-effects/once-effects.service';
import { RecastService } from '../recast/recast.service';
import { SettingsService } from '../settings/settings.service';

@Injectable({
    providedIn: 'root',
})
export class EquipmentConditionsService {

    private _evaluationService?: EvaluationService;
    private _initialized = false;

    constructor(
        private readonly _bulkService: BulkService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _onceEffectsService: OnceEffectsService,
    ) { }

    public initialize(evaluationService: EvaluationService): void {
        this._evaluationService = evaluationService;

        if (this._initialized) { return; }

        this._initialized = true;

        CreatureService.character$
            .pipe(
                switchMap(creature => this._generateCreatureEquipmentConditions(creature)),
            )
            .subscribe();

        this._creatureAvailabilityService.isCompanionAvailable$()
            .pipe(
                switchMap(isCompanionAvailable =>
                    isCompanionAvailable
                        ? CreatureService.companion$
                            .pipe(
                                switchMap(creature => this._generateCreatureEquipmentConditions(creature)),
                            )
                        : of(),
                ),
            )
            .subscribe();

        this._creatureAvailabilityService.isFamiliarAvailable$()
            .pipe(
                switchMap(isFamiliarAvailable =>
                    isFamiliarAvailable
                        ? CreatureService.familiar$
                            .pipe(
                                switchMap(creature => this._generateCreatureEquipmentConditions(creature)),
                            )
                        : of(),
                ),
            )
            .subscribe();
    }

    private _generateItemGrantedConditions$(creature: Creature): Observable<boolean> {
        //Calculate whether any items should grant a condition under the given circumstances and add or remove conditions accordingly.
        //Conditions caused by equipment are not calculated in manual mode.
        return propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                switchMap(isManualMode =>
                    isManualMode
                        ? of(false)
                        : combineLatest([
                            creature.alignment$,
                            creature.inventories.values$,
                        ])
                            .pipe(
                                tap(([alignment, inventories]) => {
                                    let hasFoundSpeedRune = false;
                                    let shouldApplyAlignmentRunePenalty = false;

                                    inventories.forEach(inventory => {
                                        inventory.allEquipment().forEach(item => {
                                            item.propertyRunes.forEach(rune => {
                                                if (rune.name === 'Speed' && item.investedOrEquipped()) {
                                                    hasFoundSpeedRune = true;
                                                }

                                                if (rune.isWeaponRune() && rune.alignmentPenalty && creature.isCharacter()) {
                                                    if (alignment.toLowerCase().includes(rune.alignmentPenalty.toLowerCase())) {
                                                        shouldApplyAlignmentRunePenalty = true;
                                                    }
                                                }
                                            });
                                            item.oilsApplied.forEach(oil => {
                                                if (oil.runeEffect && oil.runeEffect.name === 'Speed' && item.investedOrEquipped()) {
                                                    hasFoundSpeedRune = true;
                                                }

                                                if (oil.runeEffect && oil.runeEffect.alignmentPenalty && creature.isCharacter()) {
                                                    if (alignment.toLowerCase().includes(oil.runeEffect.alignmentPenalty.toLowerCase())) {
                                                        shouldApplyAlignmentRunePenalty = true;
                                                    }
                                                }
                                            });
                                        });
                                    });

                                    const hasThisCondition = (name: string, source: string): boolean =>
                                        !!this._creatureConditionsService.currentCreatureConditions(
                                            creature,
                                            { name, source },
                                            { readonly: true },
                                        ).length;
                                    const addCondition = (name: string, value: number, source: string): void => {
                                        this._creatureConditionsService.addCondition(
                                            creature,
                                            ConditionGain.from({ name, value, source, apply: true }, RecastService.recastFns),
                                            {},
                                            { noReload: true },
                                        );
                                    };
                                    const removeCondition = (name: string, value: number, source: string): void => {
                                        this._creatureConditionsService.removeCondition(
                                            creature,
                                            ConditionGain.from({ name, value, source, apply: true }, RecastService.recastFns),
                                            false,
                                        );
                                    };

                                    // Add Clumsy for each large weapon if you don't have it,
                                    // and remove Clumsy if you have it and don't have a large weapon equipped.
                                    if (
                                        creature.inventories[0].weapons
                                            .find(weapon => weapon.large && weapon.equipped) && !hasThisCondition('Clumsy', 'Large Weapon')
                                    ) {
                                        addCondition('Clumsy', 1, 'Large Weapon');
                                    } else if (
                                        !creature.inventories[0].weapons
                                            .find(weapon => weapon.large && weapon.equipped) && hasThisCondition('Clumsy', 'Large Weapon')
                                    ) {
                                        removeCondition('Clumsy', 1, 'Large Weapon');
                                    }

                                    // Add Quickened for a speed rune if you don't have it,
                                    // and remove Quickened if you have it and don't have a speed rune equipped.
                                    if (hasFoundSpeedRune && !hasThisCondition('Quickened', 'Speed Rune')) {
                                        addCondition('Quickened', 0, 'Speed Rune');
                                    } else if (!hasFoundSpeedRune && hasThisCondition('Quickened', 'Speed Rune')) {
                                        removeCondition('Quickened', 0, 'Speed Rune');
                                    }

                                    // Add Enfeebled for an alignment rune that you oppose if you don't have it,
                                    // and remove Enfeebled if you have it and don't have an alignment rune equipped that you oppose.
                                    const enfeebledPenaltyValue = 2;

                                    if (shouldApplyAlignmentRunePenalty && !hasThisCondition('Enfeebled', 'Alignment Rune')) {
                                        addCondition('Enfeebled', enfeebledPenaltyValue, 'Alignment Rune');
                                    } else if (!shouldApplyAlignmentRunePenalty && hasThisCondition('Enfeebled', 'Alignment Rune')) {
                                        removeCondition('Enfeebled', enfeebledPenaltyValue, 'Alignment Rune');
                                    }

                                    //Any items that grant permanent conditions need to check if these are still applicable.
                                    const refreshPermanentConditions = (item: Equipment, investedItem: Equipment): void => {
                                        item.gainConditions.forEach(gain => {
                                            // We test alignmentFilter and resonant here, but activationPrerequisite is only tested
                                            // if the condition exists and might still need to exist.
                                            // This is because add_Condition includes its own test of activationPrerequisite.
                                            let shouldActivate = false;
                                            const isSlottedAeonStone = (item instanceof WornItem && item.isSlottedAeonStone);

                                            if (
                                                investedItem.investedOrEquipped() &&
                                                (
                                                    gain.resonant ?
                                                        isSlottedAeonStone :
                                                        true
                                                ) && (
                                                    gain.alignmentFilter ?
                                                        (
                                                            gain.alignmentFilter.includes('!') !==
                                                            stringEqualsCaseInsensitive(
                                                                creature.alignment,
                                                                gain.alignmentFilter.replace('!', ''),
                                                                { allowPartialString: true },
                                                            )
                                                        ) :
                                                        true
                                                )
                                            ) {
                                                shouldActivate = true;
                                            }

                                            if (
                                                this._creatureConditionsService
                                                    .currentCreatureConditions(creature, { name: gain.name, source: gain.source })
                                                    .some(existingGain => !gain.choice || (existingGain.choice === gain.choice))
                                            ) {
                                                if (!shouldActivate) {
                                                    this._creatureConditionsService.removeCondition(creature, gain, false);
                                                } else {
                                                    if (gain.activationPrerequisite) {
                                                        if (!this._evaluationService) {
                                                            console.error('EvaluationService missing in EquipmentConditionsService!');
                                                        }

                                                        this._evaluationService?.valueFromFormula$(
                                                            gain.activationPrerequisite,
                                                            { creature, object: gain, parentItem: item },
                                                        )
                                                            .pipe(
                                                                take(1),
                                                            )
                                                            .subscribe(testResult => {
                                                                if (testResult === '0' || !(parseInt(testResult as string, 10))) {
                                                                    this._creatureConditionsService.removeCondition(creature, gain, false);
                                                                }
                                                            });
                                                    }
                                                }
                                            } else {
                                                if (shouldActivate) {
                                                    this._creatureConditionsService.addCondition(
                                                        creature,
                                                        gain,
                                                        { parentItem: item },
                                                        { noReload: true },
                                                    );
                                                }
                                            }
                                        });
                                    };

                                    creature.inventories[0].allEquipment()
                                        .filter(item => item.gainConditions.length)
                                        .forEach(item => {
                                            refreshPermanentConditions(item, item);
                                        });

                                    if (creature.isCharacter() && creature.hasTooManySlottedAeonStones()) {
                                        creature.inventories[0].wornitems
                                            .filter(item => item.isWayfinder)
                                            .forEach(item => {
                                                item.aeonStones.forEach(stone => {
                                                    refreshPermanentConditions(stone, item);
                                                });
                                            });
                                    }
                                }),
                                map(() => true),
                            ),
                ),
            );
    }

    /**
     * Calculate whether the creature is encumbered and add or remove the matching condition.
     *
     * @param creature
     * @returns boolean indicating whether conditions have changed.
     */
    private _generateBulkConditions$(creature: Creature): Observable<boolean> {
        //Calculate whether the creature is encumbered and add or remove the condition.

        return propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                switchMap(isManualMode =>
                    //Encumbered conditions are not calculated in manual mode.
                    isManualMode
                        ? of(false)
                        : combineLatest([
                            this._bulkService.currentValue$(creature),
                            this._bulkService.encumberedLimit$(creature),
                        ])
                            .pipe(
                                map(([currentBulk, encumberedLimit]) => {
                                    let didBulkConditionsChange = false;

                                    if (
                                        currentBulk.result > encumberedLimit.result &&
                                        !this._creatureConditionsService
                                            .currentCreatureConditions(creature, { name: 'Encumbered', source: 'Bulk' })
                                            .length
                                    ) {
                                        this._creatureConditionsService.addCondition(
                                            creature,
                                            ConditionGain.from(
                                                { name: 'Encumbered', value: 0, source: 'Bulk', apply: true },
                                                RecastService.recastFns,
                                            ),
                                            {},
                                            { noReload: true },
                                        );

                                        didBulkConditionsChange = true;
                                    }

                                    if (
                                        currentBulk.result <= encumberedLimit.result &&
                                        !!this._creatureConditionsService
                                            .currentCreatureConditions(creature, { name: 'Encumbered', source: 'Bulk' })
                                            .length
                                    ) {
                                        this._creatureConditionsService.removeCondition(
                                            creature,
                                            ConditionGain.from(
                                                { name: 'Encumbered', value: 0, source: 'Bulk', apply: true },
                                                RecastService.recastFns,
                                            ),
                                            true,
                                        );

                                        didBulkConditionsChange = true;
                                    }

                                    return didBulkConditionsChange;
                                }),
                            ),
                ),
            );
    }

    private _generateCreatureEquipmentConditions(creature: Creature): Observable<[boolean, boolean]> {
        // Perpetually add or remove conditions depending on the creature's equipment.
        return combineLatest([
            this._generateItemGrantedConditions$(creature),
            this._generateBulkConditions$(creature),
        ])
            .pipe(
                tap(() => {
                    //Process all onceEffects that were prepared by gaining or losing conditions.
                    this._onceEffectsService.processPreparedOnceEffects();
                }),
            );
    }

}

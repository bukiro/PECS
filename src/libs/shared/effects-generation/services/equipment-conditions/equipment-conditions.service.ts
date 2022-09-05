import { Injectable } from '@angular/core';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';
import { CreatureService } from 'src/app/services/character.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { BulkService } from 'src/libs/shared/services/bulk/bulk.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { SettingsService } from 'src/app/core/services/settings/settings.service';

@Injectable({
    providedIn: 'root',
})
export class EquipmentConditionsService {

    private _evaluationService?: EvaluationService;

    constructor(
        private readonly _bulkService: BulkService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,

    ) { }

    public generateItemGrantedConditions(
        creature: Creature,
    ): void {
        //Calculate whether any items should grant a condition under the given circumstances and add or remove conditions accordingly.
        //Conditions caused by equipment are not calculated in manual mode.
        if (SettingsService.isManualMode) {
            return;
        }

        const character = CreatureService.character;

        let hasFoundSpeedRune = false;
        let shouldApplyAlignmentRunePenalty = false;

        creature.inventories.forEach(inventory => {
            inventory.allEquipment().forEach(item => {
                item.propertyRunes.forEach(rune => {
                    if (rune.name === 'Speed' && item.investedOrEquipped()) {
                        hasFoundSpeedRune = true;
                    }

                    if (rune instanceof WeaponRune && rune.alignmentPenalty && creature.isCharacter()) {
                        if (character.alignment.toLowerCase().includes(rune.alignmentPenalty.toLowerCase())) {
                            shouldApplyAlignmentRunePenalty = true;
                        }
                    }
                });
                item.oilsApplied.forEach(oil => {
                    if (oil.runeEffect && oil.runeEffect.name === 'Speed' && item.investedOrEquipped()) {
                        hasFoundSpeedRune = true;
                    }

                    if (oil.runeEffect && oil.runeEffect.alignmentPenalty && creature.isCharacter()) {
                        if (character.alignment.toLowerCase().includes(oil.runeEffect.alignmentPenalty.toLowerCase())) {
                            shouldApplyAlignmentRunePenalty = true;
                        }
                    }
                });
            });
        });

        const hasThisCondition = (name: string, source: string): boolean =>
            !!this._creatureConditionsService.currentCreatureConditions(creature, { name, source }, { readonly: true }).length;
        const addCondition = (name: string, value: number, source: string): void => {
            this._creatureConditionsService.addCondition(
                creature,
                Object.assign(new ConditionGain(), { name, value, source, apply: true }),
                {},
                { noReload: true },
            );
        };
        const removeCondition = (name: string, value: number, source: string): void => {
            this._creatureConditionsService.removeCondition(
                creature,
                Object.assign(new ConditionGain(), { name, value, source, apply: true }),
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
                // if the condition exists and might need to be removed.
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
                                creature.alignment.toLowerCase().includes(gain.alignmentFilter.toLowerCase().replace('!', ''))
                            ) :
                            true
                    )
                ) {
                    shouldActivate = true;
                }

                if (
                    this._creatureConditionsService
                        .currentCreatureConditions(creature, { name: gain.name, source: gain.source })
                        .filter(existingGain => !gain.choice || (existingGain.choice === gain.choice)).length
                ) {
                    if (!shouldActivate) {
                        this._creatureConditionsService.removeCondition(creature, gain, false);
                    } else {
                        if (gain.activationPrerequisite) {
                            if (!this._evaluationService) { console.error('evaluationService missing!'); }

                            const testResult = this._evaluationService?.valueFromFormula(
                                gain.activationPrerequisite,
                                { creature, object: gain, parentItem: item },
                            );

                            if (testResult === '0' || !(parseInt(testResult as string, 10))) {
                                this._creatureConditionsService.removeCondition(creature, gain, false);
                            }
                        }
                    }
                } else {
                    if (shouldActivate) {
                        this._creatureConditionsService.addCondition(creature, gain, { parentItem: item }, { noReload: true });
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
            creature.inventories[0].wornitems.filter(item => item.isWayfinder).forEach(item => {
                item.aeonStones.forEach(stone => {
                    refreshPermanentConditions(stone, item);
                });
            });
        }
    }

    public generateBulkConditions(creature: Creature): void {
        //Calculate whether the creature is encumbered and add or remove the condition.
        //Encumbered conditions are not calculated in manual mode.
        if (!SettingsService.isManualMode) {
            const calculatedBulk = this._bulkService.calculate(creature);

            if (
                calculatedBulk.current.value > calculatedBulk.encumbered.value &&
                !this._creatureConditionsService.currentCreatureConditions(creature, { name: 'Encumbered', source: 'Bulk' }).length
            ) {
                this._creatureConditionsService.addCondition(
                    creature,
                    Object.assign(new ConditionGain(), { name: 'Encumbered', value: 0, source: 'Bulk', apply: true }),
                    {},
                    { noReload: true },
                );
            }

            if (
                calculatedBulk.current.value <= calculatedBulk.encumbered.value &&
                !!this._creatureConditionsService.currentCreatureConditions(creature, { name: 'Encumbered', source: 'Bulk' }).length
            ) {
                this._creatureConditionsService.removeCondition(
                    creature,
                    Object.assign(new ConditionGain(), { name: 'Encumbered', value: 0, source: 'Bulk', apply: true }),
                    true,
                );
            }
        }
    }

    public initialize(evaluationService: EvaluationService): void {
        this._evaluationService = evaluationService;
    }

}

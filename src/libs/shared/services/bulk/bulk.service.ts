import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureSizes } from '../../definitions/creatureSizes';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CreaturePropertiesService } from '../creature-properties/creature-properties.service';
import { InventoryPropertiesService } from '../inventory-properties/inventory-properties.service';

export interface CalculatedBulk {
    maxabsolutes: Array<Effect>;
    maxbonuses: boolean;
    maxpenalties: boolean;
    max: { value: number; explain: string };
    currentabsolutes: Array<Effect>;
    currentbonuses: boolean;
    currentpenalties: boolean;
    current: { value: number; explain: string };
    encumberedabsolutes: Array<Effect>;
    encumberedbonuses: boolean;
    encumberedpenalties: boolean;
    encumbered: { value: number; explain: string };
}

const defaultEncumberedLimitBase = 5;
const defaultBulkLimitBase = 10;

@Injectable({
    providedIn: 'root',
})
export class BulkService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creaturePropertiesService: CreaturePropertiesService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
    ) { }

    public calculate(creature: Creature): CalculatedBulk {
        const maxabsolutes = this._absolutes(creature, 'Max Bulk');
        const currentabsolutes = this._absolutes(creature, 'Bulk');
        const encumberedabsolutes = this._absolutes(creature, 'Encumbered Limit');

        const result = {
            maxabsolutes,
            maxbonuses: this._bonuses(creature, 'Max Bulk'),
            maxpenalties: this._penalties(creature, 'Max Bulk'),
            max: this._max(creature, maxabsolutes),
            currentabsolutes,
            currentbonuses: this._bonuses(creature, 'Bulk'),
            currentpenalties: this._penalties(creature, 'Bulk'),
            current: this._current(creature, currentabsolutes),
            encumberedabsolutes: currentabsolutes,
            encumberedbonuses: this._bonuses(creature, 'Encumbered Limit'),
            encumberedpenalties: this._penalties(creature, 'Encumbered Limit'),
            encumbered: this._encumbered(creature, encumberedabsolutes),
        };

        return result;
    }

    private _absolutes(creature: Creature, name: string): Array<Effect> {
        return this._effectsService.absoluteEffectsOnThis(creature, name);
    }

    private _relatives(creature: Creature, name: string): Array<Effect> {
        return this._effectsService.relativeEffectsOnThis(creature, name);
    }

    private _bonuses(creature: Creature, name: string): boolean {
        return this._effectsService.doBonusEffectsExistOnThis(creature, name);
    }

    private _penalties(creature: Creature, name: string): boolean {
        return this._effectsService.doPenaltyEffectsExistOnThis(creature, name);
    }

    private _current(
        creature: Creature,
        absolutes: Array<Effect> = this._absolutes(creature, 'Bulk'),
    ): { value: number; explain: string } {
        const inventories = creature.inventories;
        const result: { value: number; explain: string } = { value: 0, explain: '' };

        if (this._characterService.stillLoading) { return result; }

        inventories.forEach(inventory => {
            const decimal = 10;
            //To avoid decimal issues, the bulk is rounded to one decimal.
            const bulk = Math.floor(Math.max(0, inventory.totalBulk(false, true)) * decimal) / decimal;

            result.value += bulk;
            result.explain += `\n${ this._inventoryPropertiesService.effectiveName(inventory) }: ${ bulk }`;
        });
        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue, 10);
            result.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        this._relatives(creature, 'Bulk').forEach(effect => {
            result.value += parseInt(effect.value, 10);
            result.explain += `${ effect.source }: ${ effect.value }`;
        });
        result.value = Math.floor(Math.max(0, result.value));
        result.explain = result.explain.trim();

        return result;
    }

    private _encumbered(
        creature: Creature,
        absolutes: Array<Effect> = this._absolutes(creature, 'Encumbered Limit'),
    ): { value: number; explain: string } {
        //Gets the basic bulk and adds all effects
        const result: { value: number; explain: string } = {
            value: defaultEncumberedLimitBase,
            explain: `Base limit: ${ defaultEncumberedLimitBase }`,
        };

        if (this._characterService.stillLoading) { return result; }

        const str = this._abilityValuesService.mod('Strength', creature).result;

        if (str !== 0) {
            result.value += str;
            result.explain += `\nStrength Modifier: ${ str }`;
        }

        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue, 10);
            result.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        this._relatives(creature, 'Encumbered Limit').forEach(effect => {
            result.value += parseInt(effect.value, 10);
            result.explain += `\n${ effect.source }: ${ effect.value }`;
        });
        result.explain = result.explain.trim();

        return result;
    }

    private _max(
        creature: Creature,
        absolutes: Array<Effect> = this._absolutes(creature, 'Max Bulk'),
    ): { value: number; explain: string } {
        //Gets the basic bulk and adds all effects
        const result: { value: number; explain: string } =
            { value: defaultBulkLimitBase, explain: `Base limit: ${ defaultBulkLimitBase }` };

        if (this._characterService.stillLoading) { return result; }

        if (absolutes.length) {
            absolutes.forEach(effect => {
                result.value = parseInt(effect.setValue, 10);
                result.explain = `${ effect.source }: ${ effect.setValue }`;
            });
        } else {
            const str =
                creature.isFamiliar()
                    ? 0
                    : this._abilityValuesService.mod('Strength', creature).result;

            if (str !== 0) {
                result.value += str;
                result.explain += `\nStrength Modifier: ${ str }`;
            }

            const size = this._creaturePropertiesService.effectiveSize(creature);
            let sizeMultiplier = 0;

            enum SizeMultipliers {
                Tiny = .5,
                Medium = 1,
                Large = 2,
                Huge = 4,
                Gargantuan = 8,
            }

            switch (size) {
                case CreatureSizes.Tiny:
                    sizeMultiplier = SizeMultipliers.Tiny;
                    break;
                case CreatureSizes.Large:
                    sizeMultiplier = SizeMultipliers.Large;
                    break;
                case CreatureSizes.Huge:
                    sizeMultiplier = SizeMultipliers.Huge;
                    break;
                case CreatureSizes.Gargantuan:
                    sizeMultiplier = SizeMultipliers.Gargantuan;
                    break;
                default:
                    sizeMultiplier = SizeMultipliers.Medium;
            }

            if (sizeMultiplier !== SizeMultipliers.Medium) {
                result.value = Math.floor(result.value * sizeMultiplier);
                result.explain += `\nSize Multiplier: ${ sizeMultiplier }`;
            }
        }

        this._relatives(creature, 'Max Bulk').forEach(effect => {
            result.value += parseInt(effect.value, 10);
            result.explain += `\n${ effect.source }: ${ effect.value }`;
        });

        return result;
    }

}

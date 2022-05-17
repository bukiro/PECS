import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Creature } from './Creature';

interface CalculatedBulk {
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

export class Bulk {
    public recast(): Bulk {
        return this;
    }
    public calculate(creature: Creature, characterService: CharacterService, effectsService: EffectsService): CalculatedBulk {
        const maxabsolutes = this._absolutes(creature, effectsService, 'Max Bulk');
        const currentabsolutes = this._absolutes(creature, effectsService, 'Bulk');
        const encumberedabsolutes = this._absolutes(creature, effectsService, 'Encumbered Limit');

        const result = {
            maxabsolutes,
            maxbonuses: this._bonuses(creature, effectsService, 'Max Bulk'),
            maxpenalties: this._penalties(creature, effectsService, 'Max Bulk'),
            max: this._max(creature, characterService, effectsService, maxabsolutes),
            currentabsolutes,
            currentbonuses: this._bonuses(creature, effectsService, 'Bulk'),
            currentpenalties: this._penalties(creature, effectsService, 'Bulk'),
            current: this._current(creature, characterService, effectsService, currentabsolutes),
            encumberedabsolutes: currentabsolutes,
            encumberedbonuses: this._bonuses(creature, effectsService, 'Encumbered Limit'),
            encumberedpenalties: this._penalties(creature, effectsService, 'Encumbered Limit'),
            encumbered: this._encumbered(creature, characterService, effectsService, encumberedabsolutes),
        };

        return result;
    }
    private _absolutes(creature: Creature, effectsService: EffectsService, name: string): Array<Effect> {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    private _relatives(creature: Creature, effectsService: EffectsService, name: string): Array<Effect> {
        return effectsService.get_RelativesOnThis(creature, name);
    }
    private _bonuses(creature: Creature, effectsService: EffectsService, name: string): boolean {
        return effectsService.show_BonusesOnThis(creature, name);
    }
    private _penalties(creature: Creature, effectsService: EffectsService, name: string): boolean {
        return effectsService.show_PenaltiesOnThis(creature, name);
    }
    private _current(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        absolutes: Array<Effect> = this._absolutes(creature, effectsService, 'Bulk'),
    ): { value: number; explain: string } {
        const inventories = creature.inventories;
        const result: { value: number; explain: string } = { value: 0, explain: '' };

        if (characterService.stillLoading()) { return result; }

        inventories.forEach(inventory => {
            const decimal = 10;
            //To avoid decimal issues, the bulk is rounded to one decimal.
            const bulk = Math.floor(Math.max(0, inventory.totalBulk(false, true)) * decimal) / decimal;

            result.value += bulk;
            result.explain += `\n${ inventory.effectiveName(characterService) }: ${ bulk }`;
        });
        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue, 10);
            result.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        this._relatives(creature, effectsService, 'Bulk').forEach(effect => {
            result.value += parseInt(effect.value, 10);
            result.explain += `${ effect.source }: ${ effect.value }`;
        });
        result.value = Math.floor(Math.max(0, result.value));
        result.explain = result.explain.trim();

        return result;
    }
    private _encumbered(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService, absolutes: Array<Effect> = this._absolutes(creature, effectsService, 'Encumbered Limit'),
    ): { value: number; explain: string } {
        //Gets the basic bulk and adds all effects
        const result: { value: number; explain: string } =
            { value: defaultEncumberedLimitBase, explain: `Base limit: ${ defaultEncumberedLimitBase }` };

        if (characterService.stillLoading()) { return result; }

        const str = characterService.abilities('Strength')[0].mod(creature, characterService, effectsService).result;

        if (str !== 0) {
            result.value += str;
            result.explain += `\nStrength Modifier: ${ str }`;
        }

        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue, 10);
            result.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        this._relatives(creature, effectsService, 'Encumbered Limit').forEach(effect => {
            result.value += parseInt(effect.value, 10);
            result.explain += `\n${ effect.source }: ${ effect.value }`;
        });
        result.explain = result.explain.trim();

        return result;
    }
    private _max(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        absolutes: Array<Effect> = this._absolutes(creature, effectsService, 'Max Bulk'),
    ): { value: number; explain: string } {
        //Gets the basic bulk and adds all effects
        const result: { value: number; explain: string } =
            { value: defaultBulkLimitBase, explain: `Base limit: ${ defaultBulkLimitBase }` };

        if (characterService.stillLoading()) { return result; }

        if (absolutes.length) {
            absolutes.forEach(effect => {
                result.value = parseInt(effect.setValue, 10);
                result.explain = `${ effect.source }: ${ effect.setValue }`;
            });
        } else {
            //We cannot use instanceof Familiar here because of circular dependencies. We test typeId == 2 (Familiar) instead.
            const familiarId = 2;
            const str =
                (creature.typeId === familiarId)
                    ? 0
                    : characterService.abilities('Strength')[0]
                        .mod(creature as Character | AnimalCompanion, characterService, effectsService).result;

            if (str !== 0) {
                result.value += str;
                result.explain += `\nStrength Modifier: ${ str }`;
            }

            const size = creature.effectiveSize(effectsService);
            let sizeMultiplier = 0;

            enum SizeMultipliers {
                Tiny = .5,
                Medium = 1,
                Large = 2,
                Huge = 4,
                Gargantuan = 8,
            }

            switch (size) {
                case 'Tiny':
                    sizeMultiplier = SizeMultipliers.Tiny;
                    break;
                case 'Large':
                    sizeMultiplier = SizeMultipliers.Large;
                    break;
                case 'Huge':
                    sizeMultiplier = SizeMultipliers.Huge;
                    break;
                case 'Gargantuan':
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

        this._relatives(creature, effectsService, 'Max Bulk').forEach(effect => {
            result.value += parseInt(effect.value, 10);
            result.explain += `\n${ effect.source }: ${ effect.value }`;
        });

        return result;
    }
}

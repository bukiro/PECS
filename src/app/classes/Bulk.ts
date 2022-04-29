import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Creature } from './Creature';

export class Bulk {
    recast() {
        return this;
    }
    calculate(creature: Creature, characterService: CharacterService, effectsService: EffectsService) {
        const maxabsolutes = this.absolutes(creature, effectsService, 'Max Bulk');
        const currentabsolutes = this.absolutes(creature, effectsService, 'Bulk');
        const encumberedabsolutes = this.absolutes(creature, effectsService, 'Encumbered Limit');

        const result = {
            maxabsolutes,
            maxbonuses: this.bonuses(creature, effectsService, 'Max Bulk'),
            maxpenalties: this.penalties(creature, effectsService, 'Max Bulk'),
            max: this.max(creature, characterService, effectsService, maxabsolutes),
            currentabsolutes,
            currentbonuses: this.bonuses(creature, effectsService, 'Bulk'),
            currentpenalties: this.penalties(creature, effectsService, 'Bulk'),
            current: this.current(creature, characterService, effectsService, currentabsolutes),
            encumberedabsolutes: currentabsolutes,
            encumberedbonuses: this.bonuses(creature, effectsService, 'Encumbered Limit'),
            encumberedpenalties: this.penalties(creature, effectsService, 'Encumbered Limit'),
            encumbered: this.encumbered(creature, characterService, effectsService, encumberedabsolutes)
        };
        return result;
    }
    absolutes(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.get_AbsolutesOnThis(creature, name);
    }
    relatives(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.get_RelativesOnThis(creature, name);
    }
    bonuses(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.show_BonusesOnThis(creature, name);
    }
    penalties(creature: Creature, effectsService: EffectsService, name: string) {
        return effectsService.show_PenaltiesOnThis(creature, name);
    }
    current(creature: Creature, characterService: CharacterService, effectsService: EffectsService, absolutes: Effect[] = undefined) {
        const inventories = creature.inventories;
        const result: { value: number, explain: string } = { value: 0, explain: '' };
        if (characterService.still_loading()) { return result; }
        inventories.forEach(inventory => {
            //To avoid decimal issues, the bulk is rounded to one decimal.
            const bulk = Math.floor(Math.max(0, inventory.get_Bulk(false, true)) * 10) / 10;
            result.value += bulk;
            result.explain += `\n${ inventory.get_Name(characterService) }: ${ bulk }`;
        });
        if (absolutes == undefined) {
            absolutes = this.absolutes(creature, effectsService, 'Bulk');
        }
        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue);
            result.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        this.relatives(creature, effectsService, 'Bulk').forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += `${ effect.source }: ${ effect.value }`;
        });
        result.value = Math.floor(Math.max(0, result.value));
        result.explain = result.explain.trim();
        return result;
    }
    encumbered(creature: Creature, characterService: CharacterService, effectsService: EffectsService, absolutes: Effect[] = undefined) {
        //Gets the basic bulk and adds all effects
        const result: { value: number, explain: string } = { value: 5, explain: 'Base limit: 5' };
        if (characterService.still_loading()) { return result; }
        const str = characterService.get_Abilities('Strength')[0].mod(creature, characterService, effectsService).result;
        if (str != 0) {
            result.value += str;
            result.explain += `\nStrength Modifier: ${ str }`;
        }
        if (absolutes == undefined) {
            absolutes = this.absolutes(creature, effectsService, 'Encumbered Limit');
        }
        absolutes.forEach(effect => {
            result.value = parseInt(effect.setValue);
            result.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        this.relatives(creature, effectsService, 'Encumbered Limit').forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += `\n${ effect.source }: ${ effect.value }`;
        });
        result.explain = result.explain.trim();
        return result;
    }
    max(creature: Creature, characterService: CharacterService, effectsService: EffectsService, absolutes: Effect[] = undefined) {
        //Gets the basic bulk and adds all effects
        const result: { value: number, explain: string } = { value: 10, explain: 'Base limit: 10' };
        if (characterService.still_loading()) { return result; }
        if (absolutes == undefined) {
            absolutes = this.absolutes(creature, effectsService, 'Max Bulk');
        }
        if (absolutes.length) {
            absolutes.forEach(effect => {
                result.value = parseInt(effect.setValue);
                result.explain = `${ effect.source }: ${ effect.setValue }`;
            });
        } else {
            //We cannot use instanceof Familiar here because of circular dependencies. We test typeId == 2 (Familiar) instead.
            const str = (creature.typeId == 2) ? 0 : characterService.get_Abilities('Strength')[0].mod(creature as Character | AnimalCompanion, characterService, effectsService).result;
            if (str != 0) {
                result.value += str;
                result.explain += `\nStrength Modifier: ${ str }`;
            }
            const size = creature.get_Size(effectsService);
            let sizeMultiplier = 0;
            switch (size) {
                case 'Tiny':
                    sizeMultiplier = .5;
                    break;
                case 'Large':
                    sizeMultiplier = 2;
                    break;
                case 'Huge':
                    sizeMultiplier = 4;
                    break;
                case 'Gargantuan':
                    sizeMultiplier = 8;
                    break;
            }
            if (sizeMultiplier) {
                result.value = Math.floor(result.value * sizeMultiplier);
                result.explain += `\nSize Multiplier: ${ sizeMultiplier }`;
            }
        }
        this.relatives(creature, effectsService, 'Max Bulk').forEach(effect => {
            result.value += parseInt(effect.value);
            result.explain += `\n${ effect.source }: ${ effect.value }`;
        });
        return result;
    }
}

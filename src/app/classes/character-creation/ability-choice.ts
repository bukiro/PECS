
import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Character } from '../creatures/character/character';

const { assign, forExport, isEqual } = setupSerialization<AbilityChoice>({
    primitives: [
        'available', 'baseValuesLost', 'id', 'infoOnly', 'source', 'type', 'bonus',
    ],
    primitiveArrays: [
        'filter',
    ],
    primitiveObjectArrays: [
        'boosts',
    ],
});

export class AbilityChoice implements Serializable<AbilityChoice> {
    public available = 0;
    //How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost = 0;
    public id = '';
    public infoOnly = false;
    public source = '';
    public type: 'Boost' | 'Flaw' = 'Boost';
    public bonus = false;

    public filter: Array<string> = [];

    public boosts: Array<AbilityBoost> = [];

    public static from(values: DeepPartial<AbilityChoice>): AbilityChoice {
        return new AbilityChoice().with(values);
    }

    public with(values: DeepPartial<AbilityChoice>): AbilityChoice {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AbilityChoice> {
        return {
            ...forExport(this),
        };
    }

    public clone(): AbilityChoice {
        return AbilityChoice.from(this);
    }

    public isEqual(compared: Partial<AbilityChoice>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public maxAvailable(character: Character): number {
        return this.available - (character.baseValues.length ? this.baseValuesLost : 0);
    }
}

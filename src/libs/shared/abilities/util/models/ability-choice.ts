import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { Character } from '../../../character/util/models/character';
import { signal } from '@angular/core';
import { AbilityBoost } from './ability-boost';

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
    // How many of the available ability boosts are lost if you rolled your own ability scores?
    public baseValuesLost = 0;
    public id = '';
    public infoOnly = false;
    public source = '';
    public type: 'Boost' | 'Flaw' = 'Boost';
    public bonus = false;

    public filter = signal<Array<string>>([]);

    public boosts = signal<Array<AbilityBoost>>([]);

    public static from(values: MaybeSerialized<AbilityChoice>): AbilityChoice {
        return new AbilityChoice().with(values);
    }

    public with(values: MaybeSerialized<AbilityChoice>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AbilityChoice> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return AbilityChoice.from(this) as this;
    }

    public isEqual(compared: Partial<AbilityChoice>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public maxAvailable(character: Character): number {
        return this.available - (character.baseValues.length ? this.baseValuesLost : 0);
    }
}

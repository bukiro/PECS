import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { ItemGain } from '../../items/item-gain';
import { signal } from '@angular/core';

const { assign, forExport, isEqual } = setupSerialization<Ancestry>({
    primitives: [
        'disabled', 'warning', 'baseLanguages', 'hitPoints', 'name', 'sourceBook', 'size',
    ],
    primitiveArrays: [
        'ancestries', 'heritages', 'languages', 'recommendedLanguages', 'senses', 'traits',
    ],
    primitiveObjectArrays: [
        'desc', 'speeds',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
    },
});

export class Ancestry implements Serializable<Ancestry> {
    public disabled = '';
    public warning = '';
    public baseLanguages = 0;
    public hitPoints = 0;
    public name = '';
    public sourceBook = '';
    public size = 0;

    public readonly ancestries = signal<Array<string>>([]);
    public heritages: Array<string> = [];
    public languages: Array<string> = [];
    public recommendedLanguages: Array<string> = [];
    public senses: Array<string> = [];

    public desc: Array<{ name: string; value: string }> = [];
    public speeds: Array<{ name: string; value: number }> = [];

    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public gainItems: Array<ItemGain> = [];

    public readonly traits = signal<Array<string>>([]);

    public static from(values: MaybeSerialized<Ancestry>): Ancestry {
        return new Ancestry().with(values);
    }

    public with(values: MaybeSerialized<Ancestry>): Ancestry {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Ancestry> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Ancestry {
        return Ancestry.from(this);
    }

    public isEqual(compared: Partial<Ancestry>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

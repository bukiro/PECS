import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { signal } from '@angular/core';
import { AbilityChoice } from 'src/libs/shared/abilities/util/models/ability-choice';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CreatureSizes } from 'src/libs/shared/size/util/models/creature-sizes';
import { Speed } from 'src/libs/shared/speed/util/models/speed';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Ancestry>({
    primitives: [
        'disabled', 'warning', 'baseLanguages', 'hitPoints', 'name', 'sourceBook', 'size',
    ],
    primitiveArrays: [
        'ancestries', 'heritages', 'languages', 'recommendedLanguages', 'senses', 'traits',
    ],
    primitiveObjectArrays: [
        'desc',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        featChoices:
            recastFns => obj => FeatChoice.from(obj, recastFns),
        gainItems:
            () => obj => ItemGain.from(obj),
        speeds:
            () => obj => Speed.from({ ...obj, source: obj.source ?? 'Ancestry' }),
    },
});

export class Ancestry implements Serializable<Ancestry> {
    public disabled = '';
    public warning = '';
    public baseLanguages = 0;
    public hitPoints = 0;
    public name = '';
    public sourceBook = '';
    public size: CreatureSizes = CreatureSizes.Medium;

    public readonly ancestries = signal<Array<string>>([]);
    public heritages: Array<string> = [];
    public languages: Array<string> = [];
    public recommendedLanguages: Array<string> = [];
    public senses: Array<string> = [];

    public desc: Array<{ name: string; value: string }> = [];
    public speeds: Array<Speed> = [];

    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public gainItems: Array<ItemGain> = [];

    public readonly traits = signal<Array<string>>([]);

    public static from(values: MaybeSerialized<Ancestry>, recastFns: RecastFns): Ancestry {
        return new Ancestry().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Ancestry>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Ancestry> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Ancestry.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Ancestry>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

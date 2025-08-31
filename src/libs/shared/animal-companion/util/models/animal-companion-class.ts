import { Signal, signal } from '@angular/core';
import { AnimalCompanionAncestry } from 'src/libs/shared/animal-companion/util/models/animal-companion-ancestry';
import { AnimalCompanionSpecialization } from 'src/libs/shared/feats/util/models/animal-companion-specialization';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { AnimalCompanionStage } from './animal-companion-stage';

const AnimalCompanionDefaultHitPoints = 6;

const { assign, forExport, isEqual } = setupSerializationWithHelpers<AnimalCompanionClass>({
    primitives: [
        'hitPoints',
    ],
    serializables: {
        ancestry:
            recastFns => obj => AnimalCompanionAncestry.from(obj, recastFns),
    },
    serializableArrays: {
        specializations:
            () => obj => AnimalCompanionSpecialization.from(obj),
    },
});

export class AnimalCompanionClass implements Serializable<AnimalCompanionClass> {
    public hitPoints = AnimalCompanionDefaultHitPoints;

    public readonly stages$$: Signal<Array<AnimalCompanionStage>>;
    public readonly ancestry = signal(new AnimalCompanionAncestry());
    public readonly specializations = signal<Array<AnimalCompanionSpecialization>>([]);

    constructor(recastFns: RecastFns) {
        this.stages$$ = recastFns.getAnimalCompanionStages();
    }

    public static from(values: MaybeSerialized<AnimalCompanionClass>, recastFns: RecastFns): AnimalCompanionClass {
        return new AnimalCompanionClass(recastFns).with(values, recastFns);
    }

    public with(values: MaybeSerialized<AnimalCompanionClass>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<AnimalCompanionClass> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return AnimalCompanionClass.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AnimalCompanionClass>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

import { AnimalCompanionLevel } from 'src/app/classes/creatures/animal-companion/animal-companion-level';
import { AnimalCompanionAncestry } from 'src/app/classes/creatures/animal-companion/animal-companion-ancestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/creatures/animal-companion/animal-companion-specialization';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { signal } from '@angular/core';

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
        levels:
            () => obj => AnimalCompanionLevel.from(obj),
        specializations:
            () => obj => AnimalCompanionSpecialization.from(obj),
    },
});

export class AnimalCompanionClass implements Serializable<AnimalCompanionClass> {
    public hitPoints = AnimalCompanionDefaultHitPoints;

    public readonly ancestry = signal(new AnimalCompanionAncestry());
    public readonly levels = signal<Array<AnimalCompanionLevel>>([]);
    public readonly specializations = signal<Array<AnimalCompanionSpecialization>>([]);

    public static from(values: MaybeSerialized<AnimalCompanionClass>, recastFns: RecastFns): AnimalCompanionClass {
        return new AnimalCompanionClass().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AnimalCompanionClass>, recastFns: RecastFns): AnimalCompanionClass {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<AnimalCompanionClass> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): AnimalCompanionClass {
        return AnimalCompanionClass.from(this, recastFns);
    }

    public isEqual(compared: Partial<AnimalCompanionClass>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

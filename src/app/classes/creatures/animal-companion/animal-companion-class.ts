import { AnimalCompanionLevel } from 'src/app/classes/creatures/animal-companion/animal-companion-level';
import { AnimalCompanionAncestry } from 'src/app/classes/creatures/animal-companion/animal-companion-ancestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/creatures/animal-companion/animal-companion-specialization';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject } from 'rxjs';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';

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

    public readonly ancestry$: BehaviorSubject<AnimalCompanionAncestry>;

    private _ancestry = new AnimalCompanionAncestry();
    private readonly _levels = new OnChangeArray<AnimalCompanionLevel>();
    private readonly _specializations = new OnChangeArray<AnimalCompanionSpecialization>();

    constructor() {
        this.ancestry$ = new BehaviorSubject(this._ancestry);
    }

    public get ancestry(): AnimalCompanionAncestry {
        return this._ancestry;
    }

    public set ancestry(value: AnimalCompanionAncestry) {
        this._ancestry = value;
        this.ancestry$.next(this._ancestry);
    }

    public get levels(): OnChangeArray<AnimalCompanionLevel> {
        return this._levels;
    }

    public set levels(value: Array<AnimalCompanionLevel>) {
        this._levels.setValues(...value);
    }

    public get specializations(): OnChangeArray<AnimalCompanionSpecialization> {
        return this._specializations;
    }

    public set specializations(value: Array<AnimalCompanionSpecialization>) {
        this._specializations.setValues(...value);
    }

    public static from(values: DeepPartial<AnimalCompanionClass>, recastFns: RecastFns): AnimalCompanionClass {
        return new AnimalCompanionClass().with(values, recastFns);
    }

    public with(values: DeepPartial<AnimalCompanionClass>, recastFns: RecastFns): AnimalCompanionClass {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<AnimalCompanionClass> {
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

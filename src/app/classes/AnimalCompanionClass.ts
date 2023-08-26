import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject } from 'rxjs';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';

const AnimalCompanionDefaultHitPoints = 6;

export class AnimalCompanionClass {
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

    public recast(recastFns: RecastFns): AnimalCompanionClass {
        this.ancestry = Object.assign(new AnimalCompanionAncestry(), this.ancestry).recast(recastFns);
        this.levels = this.levels.map(obj => Object.assign(new AnimalCompanionLevel(), obj).recast());
        this.specializations = this.specializations.map(obj => Object.assign(new AnimalCompanionSpecialization(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): AnimalCompanionClass {
        return Object.assign<AnimalCompanionClass, AnimalCompanionClass>(
            new AnimalCompanionClass(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }
}

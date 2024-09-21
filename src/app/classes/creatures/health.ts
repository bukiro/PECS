import { BehaviorSubject, filter, map, Observable, tap } from 'rxjs';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { isDefined } from 'src/libs/shared/util/type-guard-utils';
import { TemporaryHP } from './temporary-hp';

const defaultTemporaryHP = { amount: 0, source: '', sourceId: '' };

const { assign, forExport, isEqual } = setupSerialization<Health>({
    primitives: [
        'damage',
        'manualWounded',
        'manualDying',
    ],
    serializableArrays: {
        temporaryHP: () => obj => TemporaryHP.from(obj),
    },
});

export class Health implements Serializable<Health> {
    public readonly damage$: BehaviorSubject<number>;
    public readonly manualWounded$: BehaviorSubject<number>;
    public readonly manualDying$: BehaviorSubject<number>;
    public readonly mainTemporaryHP$: Observable<TemporaryHP>;

    private _damage = 0;
    private _manualWounded = 0;
    private _manualDying = 0;

    private readonly _temporaryHP = new OnChangeArray<TemporaryHP>(
        TemporaryHP.from(defaultTemporaryHP),
    );

    constructor() {
        this.damage$ = new BehaviorSubject(this._damage);
        this.manualWounded$ = new BehaviorSubject(this._manualWounded);
        this.manualDying$ = new BehaviorSubject(this._manualDying);

        this.mainTemporaryHP$ =
            this.temporaryHP.values$
                .pipe(
                    tap(temporaryHP => {
                        if (temporaryHP.length) {
                            this.temporaryHP = [TemporaryHP.from(defaultTemporaryHP)];
                        }
                    }),
                    map(temporaryHP => temporaryHP[0]),
                    filter(isDefined),
                );
    }

    public get mainTemporaryHP(): TemporaryHP {
        const mainTemporaryHP = this.temporaryHP[0] ?? TemporaryHP.from(defaultTemporaryHP);

        if (!this.temporaryHP.length) {
            this.temporaryHP = [mainTemporaryHP];
        }

        return mainTemporaryHP;
    }

    public set mainTemporaryHP(value: TemporaryHP) {
        this.temporaryHP[0] = value;
        this.temporaryHP.onChange();
    }

    public get damage(): number {
        return this._damage;
    }

    public set damage(value: number) {
        this._damage = value;
        this.damage$.next(this._damage);
    }

    public get manualWounded(): number {
        return this._manualWounded;
    }

    public set manualWounded(value: number) {
        this._manualWounded = value;
        this.manualWounded$.next(this._manualWounded);
    }

    public get manualDying(): number {
        return this._manualDying;
    }

    public set manualDying(value: number) {
        this._manualDying = value;
        this.manualDying$.next(this._manualDying);
    }

    public get temporaryHP(): OnChangeArray<TemporaryHP> {
        return this._temporaryHP;
    }

    public set temporaryHP(value: Array<TemporaryHP>) {
        this._temporaryHP.setValues(...value);
    }

    public static from(values: DeepPartial<Health>): Health {
        return new Health().with(values);
    }

    public with(values: DeepPartial<Health>): Health {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Health> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Health {
        return Health.from(this);
    }

    public isEqual(compared: Partial<Health>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

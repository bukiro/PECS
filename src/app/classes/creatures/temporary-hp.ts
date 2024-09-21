import { BehaviorSubject } from 'rxjs';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<TemporaryHP>({
    primitives: [
        'source',
        'sourceId',
        'amount',
    ],
});

export class TemporaryHP implements Serializable<TemporaryHP> {
    public source = '';
    public sourceId = '';

    public readonly amount$: BehaviorSubject<number>;

    private _amount = 0;

    constructor() {
        this.amount$ = new BehaviorSubject(this._amount);
    }

    public get amount(): number {
        return this._amount;
    }

    public set amount(value: number) {
        this._amount = value;
        this.amount$.next(this._amount);
    }

    public static from(values: DeepPartial<TemporaryHP>): TemporaryHP {
        return new TemporaryHP().with(values);
    }

    public with(values: DeepPartial<TemporaryHP>): TemporaryHP {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<TemporaryHP> {
        return {
            ...forExport(this),
        };
    }

    public clone(): TemporaryHP {
        return TemporaryHP.from(this);
    }

    public isEqual(compared: Partial<TemporaryHP>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

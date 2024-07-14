
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<DiceResult>({
    primitives: [
        'diceNum',
        'diceSize',
        'desc',
        'bonus',
        'included',
        'type',
    ],
    primitiveArrays: [
        'rolls',
    ],
});

export class DiceResult implements Serializable<DiceResult> {
    public diceNum = 0;
    public diceSize = 0;
    public desc = '';
    public bonus = 0;
    public included = true;
    public type = '';

    public rolls: Array<number> = [];

    public static from(values: DeepPartial<DiceResult>): DiceResult {
        return new DiceResult().with(values);
    }

    public with(values: DeepPartial<DiceResult>): DiceResult {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<DiceResult> {
        return {
            ...forExport(this),
        };
    }

    public clone(): DiceResult {
        return DiceResult.from(this);
    }

    public isEqual(compared: Partial<DiceResult>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

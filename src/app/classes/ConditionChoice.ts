import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ConditionChoice>({
    primitives: [
        'name',
        'defaultDuration',
        'nextStage',
        'spelllevelreq',
    ],
    primitiveArrays: [
        'featreq',
    ],
});

export class ConditionChoice implements Serializable<ConditionChoice> {
    public name = '';
    public defaultDuration?: number;
    public nextStage = 0;
    public spelllevelreq = 0;

    /**
     * All featreqs must be fulfilled for the choice to be available.
     * To require one of a list, use "Feat1 or Feat2 or Feat3" as a single entry.
     */
    public featreq: Array<string> = [];

    public static from(values: DeepPartial<ConditionChoice>): ConditionChoice {
        return new ConditionChoice().with(values);
    }

    public with(values: DeepPartial<ConditionChoice>): ConditionChoice {
        assign(this, values);

        //Blank choices are saved with "name":"-" for easier managing; These need to be re-blanked here.
        if (this.name === '-') {
            this.name = '';
        }

        return this;
    }

    public forExport(): DeepPartial<ConditionChoice> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ConditionChoice {
        return ConditionChoice.from(this);
    }

    public isEqual(compared: Partial<ConditionChoice>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

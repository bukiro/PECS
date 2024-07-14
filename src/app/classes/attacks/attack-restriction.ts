import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<AttackRestriction>({
    primitives: [
        'name', 'special', 'excluding',
    ],
    primitiveArrays: [
        'conditionChoiceFilter',
    ],
});

export class AttackRestriction implements Serializable<AttackRestriction> {
    public name = '';
    /** If special is set, attacks are restricted depending on hardcoded functions. */
    public special: 'Favored Weapon' | '' = '';
    public conditionChoiceFilter: Array<string> = [];
    /** If excluding is set, you can NOT use this attack, instead of ONLY this attack. */
    public excluding = false;

    public static from(values: DeepPartial<AttackRestriction>): AttackRestriction {
        return new AttackRestriction().with(values);
    }

    public with(values: DeepPartial<AttackRestriction>): AttackRestriction {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AttackRestriction> {
        return {
            ...forExport(this),
        };
    }

    public clone(): AttackRestriction {
        return AttackRestriction.from(this);
    }

    public isEqual(compared: Partial<AttackRestriction>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

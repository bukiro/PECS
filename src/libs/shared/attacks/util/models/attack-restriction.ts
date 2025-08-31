import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

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

    public static from(values: MaybeSerialized<AttackRestriction>): AttackRestriction {
        return new AttackRestriction().with(values);
    }

    public with(values: MaybeSerialized<AttackRestriction>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AttackRestriction> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return AttackRestriction.from(this) as this;
    }

    public isEqual(compared: Partial<AttackRestriction>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

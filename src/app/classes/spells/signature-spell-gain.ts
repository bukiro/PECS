import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<SignatureSpellGain>({
    primitives: [
        'className',
        'available',
    ],
});

export class SignatureSpellGain implements Serializable<SignatureSpellGain> {
    /** You can assign signature spells for spontaneous spell slots for this class. */
    public className = '';
    /** You can assign this amount of signature spells, where -1 is unlimited. */
    public available = 0;

    public static from(values: MaybeSerialized<SignatureSpellGain>): SignatureSpellGain {
        return new SignatureSpellGain().with(values);
    }

    public with(values: MaybeSerialized<SignatureSpellGain>): SignatureSpellGain {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SignatureSpellGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SignatureSpellGain {
        return SignatureSpellGain.from(this);
    }

    public isEqual(compared: Partial<SignatureSpellGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

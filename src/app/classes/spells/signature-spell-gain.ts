import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
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

    public static from(values: DeepPartial<SignatureSpellGain>): SignatureSpellGain {
        return new SignatureSpellGain().with(values);
    }

    public with(values: DeepPartial<SignatureSpellGain>): SignatureSpellGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SignatureSpellGain> {
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

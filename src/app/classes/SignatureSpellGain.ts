export class SignatureSpellGain {
    /** You can assign signature spells for spontaneous spell slots for this class. */
    public className = '';
    /** You can assign this amount of signature spells, where -1 is unlimited. */
    public available = 0;

    public recast(): SignatureSpellGain {
        return this;
    }

    public clone(): SignatureSpellGain {
        return Object.assign<SignatureSpellGain, SignatureSpellGain>(new SignatureSpellGain(), JSON.parse(JSON.stringify(this))).recast();
    }
}

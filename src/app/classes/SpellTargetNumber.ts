export class SpellTargetNumber {
    public number = 0;
    public minLevel = 0;
    public featreq = '';

    public recast(): SpellTargetNumber {
        return this;
    }

    public clone(): SpellTargetNumber {
        return Object.assign<SpellTargetNumber, SpellTargetNumber>(new SpellTargetNumber(), JSON.parse(JSON.stringify(this))).recast();
    }
}

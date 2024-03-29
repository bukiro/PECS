export class AttackRestriction {
    public name = '';
    /** If special is set, attacks are restricted depending on hardcoded functions. */
    public special: 'Favored Weapon' | '' = '';
    public conditionChoiceFilter: Array<string> = [];
    /** If excluding is set, you can NOT use this attack, instead of ONLY this attack. */
    public excluding = false;

    public recast(): AttackRestriction {
        return this;
    }

    public clone(): AttackRestriction {
        return Object.assign<AttackRestriction, AttackRestriction>(new AttackRestriction(), JSON.parse(JSON.stringify(this))).recast();
    }
}

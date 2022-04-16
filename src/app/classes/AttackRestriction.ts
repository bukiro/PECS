export class AttackRestriction {
    public name = '';
    //If special is set, attacks are restricted depending on hardcoded functions.
    public special: 'Favored Weapon' | '' = '';
    public conditionChoiceFilter: string[] = [];
    //If excluding is set, you can NOT use this attack, instead of ONLY this attack.
    public excluding = false;
    recast() {
        return this;
    }
}

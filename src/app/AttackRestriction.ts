export class AttackRestriction {
    public name: string = "";
    public conditionChoiceFilter: string = "";
    //If excluding is set, you can NOT use this attack, instead of ONLY this attack.
    public excluding: boolean = false;
}

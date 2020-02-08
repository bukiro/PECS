export class Ability {
    effects: string[] = [];
    baseValue: number = 10;
    constructor (
    public name: string = "",
    ) {}
    value() {
        //Calculates the ability with all active effects
        //Get all active effects on the ability
        let itembonus = 4; //$scope.getEffects(this);
        //Add the effect bonus to the base value - parseInt'ed because it's from a textbox - and return it
        return this.baseValue + itembonus;
    }
    mod() {
        //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 > -5; 2-3 > -4; ... 10-11 > 0; 12-13 > 1 etc.
        return Math.floor((this.value()-10)/2)
    }
}
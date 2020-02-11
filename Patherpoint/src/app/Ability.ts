export class Ability {
    public effects: string[] = [];
    constructor (
        public name: string = "",
    ) {}
    baseValue(characterService) {
        let character = characterService.get_Character();
        //Get baseValues from the character if they exist, otherwise 10
        let baseValue = character.baseValues.filter(baseValue => baseValue.name == this.name)[0].value;
        let level = character.level;
        //Get any boosts from the character and sum them up
        //Boosts are +2 until 18, then +1
        //Flaws are always -2
        let boostSum: number = 0;
        let boosts = characterService.get_AbilityBoosts(0, level, this);
        if (boosts) {
            boosts.forEach(boost => {
                if (boost.type == "boost") {
                    boostSum += (boostSum < 8) ? 2 : 1;
                } else if (boost.type == "flaw") {
                    boostSum -= 2; 
                }
            })
        }
        baseValue = (baseValue) ? baseValue : 10;
        return baseValue + boostSum
    }
    value(characterService) {
    //Calculates the ability with all active effects
        //Get all active effects on the ability
        let itembonus = 0; //$scope.getEffects(this);
        //Add the effect bonus to the base value - parseInt'ed because it's from a textbox - and return it
        return this.baseValue(characterService) + itembonus;
    }
    mod(characterService) {
        //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 > -5; 2-3 > -4; ... 10-11 > 0; 12-13 > 1 etc.
        return Math.floor((this.value(characterService)-10)/2)
    }
}
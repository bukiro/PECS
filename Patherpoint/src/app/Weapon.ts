import { Item } from './Item'
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { TraitsService } from './traits.service';

export class Weapon implements Item {
    public notes: string = "";
    public showNotes: boolean = false;
    public parrying: boolean = false;
    constructor(
        public type: string = "weapon",
        public name: string = "",
        public equip: boolean = false,
        public prof: string = "",
        public dmgType: string = "",
        public dicenum: number = 1,
        public dicesize: number = 6,
        public melee: number = 0,
        public ranged: number = 0,
        public itembonus: number = 0,
        public moddable: boolean = true,
        public traits: string[] = [],
        public potencyRune: number = 0,
        public strikingRune: number = 0,
        public propertyRunes: string[] = [],
        public material: string = "",
        public effects: string[] = []
    ) {}
    level(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let weaponIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.name);
        let profIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.prof);
        //For Monk, Dwarf, Goblin etc. weapons, check if the character has any weapon proficiency that matches a trait of this weapon
        let traitIncreases: number[] = [];
        this.traits.forEach(trait => {
            traitIncreases.push(characterService.get_Character().get_SkillIncreases(0, charLevel, trait).length)
        })
        //Only count the highest of these proficiency (e.g. in case you have Monk weapons +4 and Dwarf weapons +2)
        let bestTraitIncreases: number = Math.max(...traitIncreases)
        //Add either the weapon category proficiency or the weapon proficiency, whichever is better
        skillLevel = Math.max(Math.min(weaponIncreases.length * 2, 8),Math.min(profIncreases.length * 2, 8),Math.min(bestTraitIncreases * 2, 8))
        return skillLevel;
    }
    get_Attack(characterService: CharacterService, effectsService: EffectsService, traitsService: TraitsService, range: string) {
    //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let charLevel = characterService.get_Character().level;
        let str  = characterService.get_Abilities("Strength")[0].mod(characterService, effectsService);
        let dex = characterService.get_Abilities("Dexterity")[0].mod(characterService, effectsService);
        let skillLevel = this.level(characterService);
        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel : 0);
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let traitMod = traitsService.get_specialModifier(this, "attack", str, dex);
        //If the previous step has resulted in a value, use that as the Ability bonus. If not, and the attack is ranged, use Dexterity, otherwise Strength
        let abilityMod = (traitMod) ? (traitMod) : (range == "ranged") ? dex : str;
        //Add up all modifiers and return the attack bonus for this attack
        let attackResult = charLevelBonus + skillLevel + this.itembonus + abilityMod;
        return attackResult;
    }
    get_Damage(characterService: CharacterService, effectsService: EffectsService, traitsService: TraitsService, range: string) {
    //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
    //Returns a string in the form of "1d6 +5"
    //Will get more complicated when runes are implemented
        let abilityDmg = "";
        let str = characterService.get_Abilities("Strength")[0].mod(characterService, effectsService);
        //Get the basic "1d6" from the weapon's dice values
        var baseDice = this.dicenum + "d" + this.dicesize;
        //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
        let traitMod = traitsService.get_specialModifier(this, "dmgBonus", str, 0);
        //If the previous step has resulted in a value, use that as the Ability bonus to damage, otherwise use Strength for Melee attacks.
        //Ranged attacks don't get a damage bonus from Abilities without Traits.
        let abilityMod = (traitMod) ? (traitMod) : (range == "melee") && str;
        //Make a nice "+5" string from the Ability bonus if there is one, or else make it empty
        abilityDmg = (abilityMod) ? ((abilityMod >= 0) && "+") + abilityMod : "";
        //Concatenate the strings for a readable damage die
        var dmgResult = baseDice + abilityDmg;
        return dmgResult;
    }

}

import { Item } from './Item'
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Armor implements Item {
    public notes: string = "";
    public showNotes: boolean = false;
    constructor(
        public type: string = "armor",
        public name: string = "",
        public equip: boolean = false,
        public prof: string = "",
        public dexcap: number = 999,
        public skillpenalty: number = 0,
        public speedpenalty: number = 0,
        public strength: number = 0,
        public itembonus: number = 0,
        public cover: number = 0,
        public moddable: boolean = true,
        public traits: string[] = [],
        public potencyRune:number = 0,
        public resilientRune:number = 0,
        public propertyRunes:string[] = [],
        public material: string = "",
        public effects: string[] = [],
        public specialEffects: string[] = []
        ) {}
    level(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let armorIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.name);
        let profIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.prof);
        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.max(Math.min(armorIncreases.length * 2, 8),Math.min(profIncreases.length * 2, 8))
        return skillLevel;
    }
    armorBonus(characterService: CharacterService, effectsService: EffectsService) {
    //Calculates the full AC bonus when wearing this armor
    //We assume that only one armor is worn at a time
        let charLevel = characterService.get_Character().level;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(characterService, effectsService);
        //Get the profiency with either this armor or its category
        let skillLevel = this.level(characterService);
        //Add character level if the character is trained or better with either the armor category or the armor itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel: 0);
        //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
        var dexBonus = (this.dexcap) ? Math.min(dex, (this.dexcap)) : dex;
        //Add up all modifiers and return the AC gained from this armor
        //Also adding any item bonus
        var defenseResult = 10 + charLevelBonus + skillLevel + this.itembonus + dexBonus;
        return defenseResult;
    }
}
import { Item } from './Item'
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Armor implements Item {
    public notes: string = "";
    public showNotes: boolean = false;
    public type: string = "armors";
    public bulk: string = "-";
    public amount: number = 1;
    //stack: How many do you buy at once - this is also how many make up one bulk unit
    public stack: number = 1;
    public name: string = "";
    public displayName: string = "";
    public hide: boolean = false;
    public equippable: boolean = true;
    public equip: boolean = false;
    public invested: boolean = false;
    public prof: string = "";
    public dexcap: number = -1;
    public skillpenalty: number = 0;
    public speedpenalty: number = 0;
    public strength: number = 0;
    public itembonus: number = 0;
    public cover: number = 0;
    public moddable: string = "armor";
    public traits: string[] = [];
    public potencyRune:number = 0;
    public resilientRune:number = 0;
    public propertyRunes:string[] = [];
    public gainActivity: string[] = [];
    public material: string = "";
    public effects: string[] = [];
    public specialEffects: string[] = []
    get_Potency(potency: number) {
        if (potency > 0) {
            return "+"+potency;
        } else {
            return "";
        }
    }
    get_Resilient(resilient: number) {
        switch (resilient) {
            case 0:
                return "";
            case 1:
                return "Resilient";
            case 2:
                return "Greater Resilient";
            case 3:
                return "Major Resilient";
        }
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let potency = this.get_Potency(this.potencyRune);
            let striking = this.get_Resilient(this.resilientRune);
            return (potency + " " + (striking + " " + this.name).trim()).trim();
        }
    }
    level(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let armorIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.name);
        let profIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.prof);
        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.min(Math.max(armorIncreases.length * 2, profIncreases.length * 2), 8)
        return skillLevel;
    }
    armorBonus(characterService: CharacterService, effectsService: EffectsService) {
    //Calculates the full AC bonus when wearing this armor
    //We assume that only one armor is worn at a time
        let explain: string = "AC Basis: 10";
        let charLevel = characterService.get_Character().level;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(characterService, effectsService);
        //Get the profiency with either this armor or its category
        let skillLevel = this.level(characterService);
        if (skillLevel) {
            explain += "\nProficiency: "+skillLevel;
        }
        //Add character level if the character is trained or better with either the armor category or the armor itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel: 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: "+charLevelBonus;
        }
        //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
        let dexBonus = (this.dexcap > -1) ? Math.min(dex, (this.dexcap)) : dex;
        if (dexBonus) {
            if (this.dexcap > -1 && this.dexcap < dex) {
                explain += "\nDexterity Modifier (capped): "+dexBonus;
            } else {
                explain += "\nDexterity Modifier: "+dexBonus;
            }
        }
        if (this.potencyRune > 0) {
            explain += "\nPotency: "+this.get_Potency(this.potencyRune);
        }
        //Add up all modifiers and return the AC gained from this armor
        //Also adding any item bonus
        let defenseResult: number = 10 + charLevelBonus + skillLevel + this.itembonus + dexBonus + this.potencyRune;
        if (this.itembonus) {
            explain += "\nArmor Bonus: "+this.itembonus;
        }
        let endresult: [number, string] = [defenseResult, explain]
        return endresult;
    }
}
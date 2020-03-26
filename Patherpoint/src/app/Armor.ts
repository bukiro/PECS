import { Item } from './Item'
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Armor implements Item {
    public notes: string = "";
    public desc: string = "";
    public name: string = "";
    public level: number = 0;
    public price: number = 0;
    public showNotes: boolean = false;
    public showName: boolean = false;
    public type: string = "armors";
    public bulk: string = "";
    public displayName: string = "";
    public hide: boolean = false;
    public equippable: boolean = true;
    public equip: boolean = false;
    public invested: boolean = false;
    private prof: string = "";
    public dexcap: number = undefined;
    private skillpenalty: number = 0;
    public speedpenalty: number = 0;
    private strength: number = 0;
    private acbonus: number = 0;
    public cover: number = 0;
    public moddable: string = "armor";
    public traits: string[] = [];
    public potencyRune:number = 0;
    public resilientRune:number = 0;
    public propertyRunes:string[] = [];
    public gainActivity: string[] = [];
    public material: string = "";
    public showon: string = "";
    public hint: string = "";
    public gainItems = [];
    public effects = [];
    public specialEffects = [];
    //For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead
    //This value influences 
    public affectedByArmoredSkirt: -1|0|1 = 0;
    get_ArmoredSkirt(characterService: CharacterService) {
        if (["Breastplate","Chain Shirt","Chain Mail","Scale Mail"].indexOf(this.name) > -1 ) {
            let armoredSkirt = characterService.get_InventoryItems().adventuringgear.filter(item => item.name == "Armored Skirt" && item.equip);
            if (armoredSkirt.length) {
                this.affectedByArmoredSkirt = 1;
                return armoredSkirt[0];
            } else {
                this.affectedByArmoredSkirt = 0;
                return null;
            }
        } else if (["Half Plate","Full Plate","Hellknight Plate"].indexOf(this.name) > -1 ) {
            let armoredSkirt = characterService.get_InventoryItems().adventuringgear.filter(item => item.name == "Armored Skirt" && item.equip);
            if (armoredSkirt.length) {
                this.affectedByArmoredSkirt = -1;
                return armoredSkirt[0];
            } else {
                this.affectedByArmoredSkirt = 0;
                return null;
            }
        } else {
            this.affectedByArmoredSkirt = 0;
            return null;
        }
    }
    get_ACBonus() {
        return this.acbonus + this.affectedByArmoredSkirt;
    }
    get_SkillPenalty() {
        return this.skillpenalty - this.affectedByArmoredSkirt;
    }
    get_DexCap() {
        if (this.dexcap != undefined) {
            return this.dexcap - this.affectedByArmoredSkirt;
        } else {
            return this.dexcap;
        }
        
    }
    get_Strength() {
        return this.strength + this.affectedByArmoredSkirt;
    }
    get_Prof() {
        if (this.affectedByArmoredSkirt == 1) {
            switch (this.prof) {
                case "Light Armor":
                    return "Medium Armor";
                case "Medium Armor":
                    return "Heavy Armor";
            }
        } else {
            return this.prof;
        }
    }
    get_Traits() {
        if (this.affectedByArmoredSkirt != 0) {
            if (this.traits.indexOf("Noisy") == -1) {
                return this.traits.concat("Noisy");
            } else {
                return this.traits;
            }
        } else {
            return this.traits;
        }
    }
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
    profLevel(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        this.get_ArmoredSkirt(characterService);
        let skillLevel: number = 0;
        let armorIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.name);
        let profIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.get_Prof());
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
        let skillLevel = this.profLevel(characterService);
        if (skillLevel) {
            explain += "\nProficiency: "+skillLevel;
        }
        //Add character level if the character is trained or better with either the armor category or the armor itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel: 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: "+charLevelBonus;
        }
        //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
        let dexBonus = (this.dexcap != undefined) ? Math.min(dex, (this.get_DexCap())) : dex;
        if (dexBonus) {
            if (this.dexcap != undefined && this.get_DexCap() < dex) {
                explain += "\nDexterity Modifier (capped): "+dexBonus;
            } else {
                explain += "\nDexterity Modifier: "+dexBonus;
            }
        }
        if (this.potencyRune > 0) {
            explain += "\nPotency: "+this.get_Potency(this.potencyRune);
        }
        //Add up all modifiers and return the AC gained from this armor
        //Also adding any inherent AC bonus
        let defenseResult: number = 10 + charLevelBonus + skillLevel + this.get_ACBonus() + dexBonus + this.potencyRune;
        if (this.get_ACBonus()) {
            explain += "\nArmor Bonus: "+this.get_ACBonus();
        }
        let endresult: [number, string] = [defenseResult, explain]
        return endresult;
    }
}
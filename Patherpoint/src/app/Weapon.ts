import { Item } from './Item'
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { WornItem } from './WornItem';
import { Effect } from './Effect';
import { ItemGain } from './ItemGain';
import { EffectGain } from './EffectGain';

export class Weapon implements Item {
    public displayName: string = "";
    public name: string = "";
    public desc: string = "";
    public level: number = 0;
    public price: number = 0;
    public hands: string = "";
    public reload: string = "";
    public ammunition: string = "";
    public notes: string = "";
    public showNotes: boolean = false;
    public showName: boolean = false;
    public parrying: boolean = false;
    public type: string = "weapons";
    public bulk: string = "";
    public hide: boolean = false;
    public equippable: boolean = true;
    public equip: boolean = false;
    public invested: boolean = false;
    public prof: string = "";
    public dmgType: string = "";
    public dicenum: number = 1;
    public dicesize: number = 6;
    public melee: number = 0;
    public ranged: number = 0;
    public moddable: string = "weapon";
    public potencyRune: number = 0;
    public strikingRune: number = 0;
    public propertyRunes: string[] = [];
    public material: string = "";
    public showon: string = "";
    public hint: string = "";
    public traits: string[] = [];
    public gainActivity: string[] = [];
    public gainItems: ItemGain[] = [];
    public effects: EffectGain[] = [];
    public specialEffects: EffectGain[] = [];
    get_Potency(potency: number) {
        if (potency > 0) {
            return "+"+potency;
        } else {
            return "";
        }
    }
    get_Striking(striking: number) {
        switch (striking) {
            case 0:
                return "";
            case 1:
                return "Striking";
            case 2:
                return "Greater Striking";
            case 3:
                return "Major Striking";
        }
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let potency = this.get_Potency(this.potencyRune);
            let striking = this.get_Striking(this.strikingRune);
            return (potency + " " + (striking + " " + this.name).trim()).trim();
        }
    }
    profLevel(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let weaponIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.name);
        let profIncreases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.prof);
        //For Monk, Dwarf, Goblin etc. weapons, check if the character has any weapon proficiency that matches a trait of this weapon
        let traitLevels: number[] = [];
        this.traits.forEach(trait => {
            let skill = characterService.get_Skills(trait, "Specific Weapon Proficiency");
            if (skill.length) {
                traitLevels.push(skill[0].level(characterService));
            }
        })
        //Only count the highest of these proficiency (e.g. in case you have Monk weapons +4 and Dwarf weapons +2)
        let bestTraitLevel: number = Math.max(...traitLevels)
        //Add either the weapon category proficiency or the weapon proficiency, whichever is better
        skillLevel = Math.max(Math.min(weaponIncreases.length * 2, 8),Math.min(profIncreases.length * 2, 8),Math.min(bestTraitLevel, 8))
        return skillLevel;
    }
    attack(characterService: CharacterService, effectsService: EffectsService, range: string) {
    //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let explain: string = "";
        let charLevel = characterService.get_Character().level;
        let str  = characterService.get_Abilities("Strength")[0].mod(characterService, effectsService);
        let dex = characterService.get_Abilities("Dexterity")[0].mod(characterService, effectsService);
        let skillLevel = this.profLevel(characterService);
        if (skillLevel) {
            explain += "\nProficiency: "+skillLevel;
        }
        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel : 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: "+charLevelBonus;
        }
        let penalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        penalty.splice(0,1);
        let bonus: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        bonus.splice(0,1);
        //The Clumsy condition affects all Dexterity attacks
        let dexEffects = effectsService.get_EffectsOnThis("Dexterity Attacks");
        let dexPenalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        dexPenalty.splice(0,1);
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({value:parseInt(effect.value), source:effect.source, penalty:true});
            dexPenaltySum += parseInt(effect.value);
        });
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let abilityMod: number = 0;
        if (range == "ranged") {
            if (characterService.have_Trait(this, "Brutal")) {
                abilityMod = str;
                explain += "\nStrength Modifier (Brutal): "+abilityMod;
            } else {
                abilityMod = dex;
                explain += "\nDexterity Modifier: "+abilityMod;
                if (dexPenalty.length) {
                    dexPenalty.forEach(singleDexPenalty => {
                        penalty.push(singleDexPenalty);
                        abilityMod += singleDexPenalty.value;
                        explain += "\n"+singleDexPenalty.source+": "+singleDexPenalty.value;
                    });
                }
            }
        } else {
            if (characterService.have_Trait(this, "Finesse") && dex + dexPenaltySum > str) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Finesse): "+abilityMod;
                if (dexPenalty.length) {
                    dexPenalty.forEach(singleDexPenalty => {
                        penalty.push(singleDexPenalty);
                        abilityMod += singleDexPenalty.value;
                        explain += "\n"+singleDexPenalty.source+": "+singleDexPenalty.value;
                    });
                }
            } else {
                abilityMod = str;
            explain += "\nStrength Modifier: "+abilityMod;
            }
        }
        let me: Weapon|WornItem = this;
        if (this.prof == "Unarmed") {
            let handwraps = characterService.get_InventoryItems().wornitems.filter(item => item.name == "Handwraps of Mighty Blows" && item.invested)
            if (handwraps.length) {
                me = handwraps[0];
            }
        }
        if (me.potencyRune > 0) {
            explain += "\nPotency: "+me.get_Potency(me.potencyRune);
            if (me.name == "Handwraps of Mighty Blows") {
                explain += "\n("+me.get_Name()+")";
            }
        }
        //Add all effects for this weapon
        let effects: Effect[] = effectsService.get_EffectsOnThis(this.name).concat(effectsService.get_EffectsOnThis("All Checks"));
        let effectsSum: number = 0;
        effects.forEach(effect => {
            if (parseInt(effect.value) < 0) {
                penalty.push({value:parseInt(effect.value), source:effect.source, penalty:true});
            } else {
                bonus.push({value:parseInt(effect.value), source:effect.source, penalty:false});
            }
            effectsSum += parseInt(effect.value);
        });
        //Add up all modifiers and return the attack bonus for this attack
        let attackResult = charLevelBonus + skillLevel + abilityMod + me.potencyRune + effectsSum;
        explain = explain.substr(1);
        return [range, attackResult, explain, penalty.concat(bonus), penalty, bonus];
    }
    damage(characterService: CharacterService, effectsService: EffectsService, range: string) {
    //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
    //Returns a string in the form of "1d6 +5"
        let explain: string = "";
        let str = characterService.get_Abilities("Strength")[0].mod(characterService, effectsService);
        //Apply Handwraps of Mighty Blows, if equipped, to unarmed attacks
        //We replace "me" with the Handwraps and use "me" instead of "this" when runes are concerned.
        let me: Weapon|WornItem = this;
        if (this.prof == "Unarmed") {
            let handwraps = characterService.get_InventoryItems().wornitems.filter(item => item.name == "Handwraps of Mighty Blows" && item.invested)
            if (handwraps.length) {
                me = handwraps[0];
            }
        }
        let dicenum = this.dicenum + me.strikingRune;
        if (me.strikingRune > 0) {
            explain += "\n"+me.get_Striking(me.strikingRune)+": Dice number +"+me.strikingRune;
            if (me.name == "Handwraps of Mighty Blows") {
                explain += "\n("+me.get_Name()+")";
            }
        }
        let dicesize = this.dicesize;
        //Monks get 1d6 for Fists instead of 1d4 via Powerful Fist
        if ((this.name == "Fist") && characterService.get_Features("Powerful Fist")[0].have(characterService)) {
            dicesize = 6;
            explain += "\nPowerful Fist: Dice size d6";
        }
        //Get the basic "1d6" from the weapon's dice values
        var baseDice = dicenum + "d" + dicesize;
        //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
        let abilityMod: number = 0;
        if (range == "ranged") {
            if (characterService.have_Trait(this, "Propulsive")) {
                if (str > 0) {
                    abilityMod = Math.floor(str / 2);
                    explain += "\nStrength Modifier (Propulsive): "+abilityMod;
                } else if (str < 0) {
                    abilityMod = str;
                    explain += "\nStrength Modifier (Propulsive): "+abilityMod;
                }
            } else if (characterService.have_Trait(this, "Thrown")) {
                abilityMod = str;
                explain += "\nStrength Modifier (Thrown): "+abilityMod;
            }
        } else {
            abilityMod = str;
            explain += "\nStrength Modifier: "+abilityMod;
        }
        let featBonus: number = 0;
        if (characterService.get_Features("Weapon Specialization")[0].have(characterService)) {
            let greaterWeaponSpecialization = false;
            if (characterService.get_Features("Greater Weapon Specialization")[0].have(characterService)) {
                greaterWeaponSpecialization = true;
            }
           switch (this.profLevel(characterService)) {
                case 4:
                    if (greaterWeaponSpecialization) {
                        featBonus += 4;
                        explain += "\nGreater Weapon Specialization: 4";
                    } else {
                        featBonus += 2;
                        explain += "\nWeapon Specialization: 2";
                    }
                    break;
                case 6:
                    if (greaterWeaponSpecialization) {
                        featBonus += 6;
                        explain += "\nGreater Weapon Specialization: 4";
                    } else {
                        featBonus += 3;
                        explain += "\nWeapon Specialization: 2";
                    }
                    break;
                case 8:
                    if (greaterWeaponSpecialization) {
                        featBonus += 8;
                        explain += "\nGreater Weapon Specialization: 4";
                    } else {
                        featBonus += 4;
                        explain += "\nWeapon Specialization: 2";
                    }
                    break;
            }
        }
        let dmgBonus: number = abilityMod + featBonus;
        //Make a nice "+5" string from the Ability bonus if there is one, or else make it empty
        let dmgBonusTotal: string = (dmgBonus) ? ((dmgBonus >= 0) && "+") + dmgBonus : "";
        //Concatenate the strings for a readable damage die
        var dmgResult = baseDice + dmgBonusTotal + this.dmgType;
        explain = explain.substr(1);
        return [dmgResult, explain];
    }
}

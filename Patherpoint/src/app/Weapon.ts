import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { WornItem } from './WornItem';
import { Effect } from './Effect';
import { Equipment } from './Equipment';
import { WeaponRune } from './WeaponRune';
import { Specialization } from './Specialization';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Oil } from './Oil';
import { SpecializationGain } from './SpecializationGain';

export class Weapon extends Equipment {
    public readonly _className: string = this.constructor.name;
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Equipment().save.concat([
        "parrying"
    ])
    //Weapons should be type "weapons" to be found in the database
    public type = "weapons";
    //Weapons are usually moddable like a weapon. Weapons that cannot be modded should be set to "-"
    moddable = "weapon" as ""|"-"|"weapon"|"armor"|"shield";
    //What type of ammo is used? (Bolts, arrows...)
    public ammunition: string = "";
    //What happens on a critical hit with this weapon?
    public criticalHint: string = ""
    //Number of dice for Damage: usually 1 for an unmodified weapon
    public dicenum: number = 1;
    //Size of the damage dice: usually 4-12
    public dicesize: number = 6;
    //What is the damage type? Usually S, B or P, but may include combinations"
    public dmgType: string = "";
    //Some weapons add additional damage like +1d4F
    public extraDamage: string = ""
    //The weapon group, needed for critical specialization effects
    public group: string = "";
    //How many hands are needed to wield this weapon?
    public hands: string = "";
    //Melee range in ft: 5 or 10 for weapons with Reach trait
    public melee: number = 0;
    //Is the weapon currently raised to parry?
    public parrying: boolean = false;
    //What proficiency is used? "Simple Weapons", "Unarmed Attacks"?
    public prof: string = "Simple Weapons";
    //Ranged range in ft - also add for thrown weapons
    //Weapons can have a melee and a ranged value, e.g. Daggers that can thrown
    public ranged: number = 0;
    //How many actions to reload this ranged weapon?
    public reload: string = "";
    //What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items.
    public weaponBase: string = "";
    get_RuneSource(creature: Character|AnimalCompanion|Familiar, range: string) {
        //Under certain circumstances, other items' runes are applied when calculating attack bonus or damage.
        //[0] is the item whose fundamental runes will count, [1] is the item whose property runes will count, and [2] is the item that causes this change.
        let runeSource: (Weapon|WornItem)[] = [this, this];
        //For unarmed attacks, return Handwraps of Mighty Blows if invested;
        if (this.prof == "Unarmed Attacks") {
            let handwraps = creature.inventories[0].wornitems.filter(item => item.isHandwrapsOfMightyBlows && item.invested)
            if (handwraps.length) {
                runeSource = [handwraps[0], handwraps[0], handwraps[0]];
            }
        }
        //Specific items (not moddable) don't profit from doubling rings.
        if (!this.moddable || this.moddable == "-") {
            return runeSource;
        }
        if (range == "melee" && this.moddable == "weapon") {
            let doublingRings = creature.inventories[0].wornitems.filter(item => item.isDoublingRings && item.data[1].value == this.id && item.invested);
            if (doublingRings.length) {
                if (doublingRings[0].data[0].value) {
                    let goldItem = creature.inventories[0].weapons.filter(weapon => weapon.id == doublingRings[0].data[0].value);
                    if (goldItem.length) {
                        if (doublingRings[0].isDoublingRings == "Doubling Rings (Greater)" && doublingRings[0].data[2]) {
                            runeSource = [goldItem[0], goldItem[0], doublingRings[0]];
                        } else {
                            runeSource = [goldItem[0], this, doublingRings[0]];
                        }
                    }
                }
            }
        }
        return runeSource;
    }
    get_Traits(creature: Character|AnimalCompanion|Familiar) {
        if (this.prof == "Unarmed Attacks") {
            let traits = JSON.parse(JSON.stringify(this.traits));
            if (creature.type == "Character") {
                if ((creature as Character).get_FeatsTaken(0, creature.level, "Diamond Fists").length && !this.traits.includes("Forceful")) {
                    traits = traits.concat("Forceful");
                }
                if ((creature as Character).get_FeatsTaken(0, creature.level, "Golden Body").length && !this.traits.includes("Deadly d12")) {
                    traits = traits.concat("Deadly d12");
                }
            }
            return traits;
        } else {
            return this.traits;
        }
    }
    profLevel(creature: Character|AnimalCompanion, characterService: CharacterService, runeSource: Weapon|WornItem, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        //There are proficiencies for "Simple Sword" or "Advanced Bow" that we need to consider, so we build that phrase here.
        let profAndGroup = this.prof.split(" ")[0] + " " + this.group;
        //There are a lot of ways to be trained with a weapon.
        //To determine the skill level, we have to find skills for the item's proficiency, its name, its weapon base and any of its traits.
        let levels: number[] = [];
        //Weapon bame, e.g. Demon Sword.
        levels.push(characterService.get_Skills(creature, this.name)[0]?.level(creature, characterService, charLevel) || 0);
        //Weapon base, e.g. Longsword.
        levels.push(this.weaponBase ? characterService.get_Skills(creature, this.weaponBase)[0]?.level(creature, characterService, charLevel) : 0);
        //Proficiency and Group, e.g. Martial Sword.
        levels.push(characterService.get_Skills(creature, profAndGroup)[0]?.level(creature, characterService, charLevel) || 0);
        //Proficiency, e.g. Martial Weapons.
        levels.push(characterService.get_Skills(creature, this.prof)[0]?.level(creature, characterService, charLevel) || 0);
        //Any traits, e.g. Monk.
        levels.push(...this.traits.map(trait => characterService.get_Skills(creature, trait)[0]?.level(creature, characterService, charLevel) || 0))
        //Get the skill level by applying the result with the most increases, but no higher than 8.
        skillLevel = Math.min(Math.max(...levels.filter(level => level != undefined)), 8);
        //If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level, up to the highest proficiency you have.
        let bestSkillLevel: number = skillLevel;
        if (runeSource.propertyRunes.filter(rune => rune.name == "Ancestral Echoing").length) {
            //First, we get all the weapon proficiencies...
            let skills: number[] = characterService.get_Skills(creature, "", "Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", "Specific Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel)));
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        //If you have an oil applied that emulates an Ancestral Echoing rune, apply the same rule (there is no such oil, but things can change)
        if (this.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.name == "Ancestral Echoing").length) {
            //First, we get all the weapon proficiencies...
            let skills: number[] = characterService.get_Skills(creature, "", "Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", "Specific Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel)));
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        return bestSkillLevel;
    }
    attack(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string) {
    //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let explain: string = "";
        let charLevel = characterService.get_Character().level;
        let str  = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        let runeSource: (Weapon|WornItem)[] = this.get_RuneSource(creature, range);
        let skillLevel = this.profLevel(creature, characterService, runeSource[1]);
        if (skillLevel) {
            explain += "\nProficiency: "+skillLevel;
        }
        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel : 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: "+charLevelBonus;
        }
        let penalties: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        let bonuses: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        let absolutes: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        //The Clumsy condition affects all Dexterity attacks
        let dexEffects = effectsService.get_RelativesOnThis(creature, "Dexterity-based Checks and DCs");
        let dexPenalty: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:true});
            dexPenaltySum += parseInt(effect.value);
        });
        //The Enfeebled condition affects all Strength attacks
        let strEffects = effectsService.get_RelativesOnThis(creature, "Strength-based Checks and DCs");
        let strPenalty: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:true});
            strPenaltySum += parseInt(effect.value);
        });
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let abilityMod: number = 0;
        if (range == "ranged") {
            if (characterService.have_Trait(this, "Brutal")) {
                abilityMod = str;
                explain += "\nStrength Modifier (Brutal): "+abilityMod;
                if (strPenalty.length) {
                    strPenalty.forEach(singleStrPenalty => {
                        penalties.push(singleStrPenalty);
                        abilityMod += singleStrPenalty.value;
                        explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                    });
                }
            } else {
                abilityMod = dex;
                explain += "\nDexterity Modifier: "+abilityMod;
                if (dexPenalty.length) {
                    dexPenalty.forEach(singleDexPenalty => {
                        penalties.push(singleDexPenalty);
                        abilityMod += singleDexPenalty.value;
                        explain += "\n"+singleDexPenalty.source+": "+singleDexPenalty.value;
                    });
                }
            }
        } else {
            if (characterService.have_Trait(this, "Finesse") && dex + dexPenaltySum > str + strPenaltySum) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Finesse): "+abilityMod;
                if (dexPenalty.length) {
                    dexPenalty.forEach(singleDexPenalty => {
                        penalties.push(singleDexPenalty);
                        abilityMod += singleDexPenalty.value;
                        explain += "\n"+singleDexPenalty.source+": "+singleDexPenalty.value;
                    });
                }
            } else {
                abilityMod = str;
                explain += "\nStrength Modifier: "+abilityMod;
                if (strPenalty.length) {
                    strPenalty.forEach(singleStrPenalty => {
                        penalties.push(singleStrPenalty);
                        abilityMod += singleStrPenalty.value;
                        explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                    });
                }
            }
        }
        //Add up all modifiers before effects and item bonus
        let attackResult = charLevelBonus + skillLevel + abilityMod;
        //Add absolute effects
        effectsService.get_AbsolutesOnThis(creature, this.name)
            .concat(effectsService.get_AbsolutesOnThis(creature, "Attack Rolls"))
            //"Unarmed Attack Rolls", "Simple Attack Rolls" etc.
            .concat(effectsService.get_AbsolutesOnThis(creature, this.prof.split(" ")[0]+"Attack Rolls"))
            //"Ranged Attack Rolls", "Melee Attack Rolls"
            .concat(effectsService.get_AbsolutesOnThis(creature, range+" Attack Rolls"))
            .concat(effectsService.get_AbsolutesOnThis(creature, "All Checks and DCs"))
            .forEach(effect => {
            attackResult = parseInt(effect.setValue)
            explain = effect.source + ": " + effect.setValue;
            absolutes.push({value:0, setValue:effect.setValue, source:effect.source, penalty:false})
        });
        //Add potency bonus
        if (runeSource[0].get_PotencyRune() > 0) {
            explain += "\nPotency: "+runeSource[0].get_Potency(runeSource[0].get_PotencyRune());
            if (runeSource[2]) {
                explain += "\n("+runeSource[2].get_Name()+")";
            }
        }
        //Add relative effects
        let effectsSum: number = 0;
        effectsService.get_RelativesOnThis(creature, this.name)
            .concat(effectsService.get_RelativesOnThis(creature, "Attack Rolls"))
            //"Unarmed Attack Rolls", "Simple Attack Rolls" etc.
            .concat(effectsService.get_RelativesOnThis(creature, this.prof.split(" ")[0]+" Attack Rolls"))
            //"Ranged Attack Rolls", "Melee Attack Rolls"
            .concat(effectsService.get_RelativesOnThis(creature, range+" Attack Rolls"))
            .concat(effectsService.get_RelativesOnThis(creature, "All Checks and DCs"))
            .forEach(effect => {
            if (parseInt(effect.value) < 0) {
                penalties.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:true});
            } else {
                bonuses.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:false});
            }
            effectsSum += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + effect.value;
        });
        //Add up all modifiers and return the attack bonus for this attack
        attackResult += runeSource[0].get_PotencyRune() + effectsSum;
        explain = explain.trim();
        return [range, attackResult, explain, penalties.concat(bonuses).concat(absolutes), penalties, bonuses, absolutes];
    }
    get_ExtraDamage(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, range: string) {
        let extraDamage: string = "";
        if (this.extraDamage) {
            extraDamage += "\n"+this.extraDamage;
        }
        this.get_RuneSource(creature, range)[1].propertyRunes
            .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
            .forEach((weaponRune: WeaponRune) => {
                extraDamage += "\n"+weaponRune.extraDamage;
            });
        this.oilsApplied
            .filter((oil: Oil) => oil.runeEffect && oil.runeEffect.extraDamage)
            .forEach((oil: Oil) => {
                extraDamage += "\n"+oil.runeEffect.extraDamage;
            });
        return extraDamage;
    }
    damage(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string) {
    //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
    //Returns a string in the form of "1d6 +5"
        let explain: string = "";
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        let penalty: {value:number, source:string, penalty:boolean}[] = [];
        //Apply any mechanism that copy runes from another item, like Handwraps of Mighty Blows or Doubling Rings.
        //We set runeSource to the respective item and use it whenever runes are concerned.
        let runeSource: (Weapon|WornItem)[] = this.get_RuneSource(creature, range);
        //Add the striking rune or oil of potency effect of the runeSource.
        let dicenum = this.dicenum + runeSource[0].get_StrikingRune();
        effectsService.get_AbsolutesOnThis(creature, this.name+" Dice Number")
            .concat(effectsService.get_AbsolutesOnThis(creature, this.weaponBase+" Dice number"))
            .forEach(effect => {
                dicenum = parseInt(effect.setValue);
                explain += "\n"+effect.source+": Dice number "+dicenum;
            })
        effectsService.get_RelativesOnThis(creature, this.name+" Dice Number")
        .concat(effectsService.get_RelativesOnThis(creature, this.weaponBase+" Dice Number"))
        .forEach(effect => {
            dicenum += parseInt(effect.value);
            explain += "\n"+effect.source+": Dice number +"+parseInt(effect.value);
        })
        if (runeSource[0].get_StrikingRune() > 0) {
            explain += "\n"+runeSource[0].get_Striking(runeSource[0].get_StrikingRune())+": Dice number +"+runeSource[0].get_StrikingRune();
            if (runeSource[2]) {
                explain += "\n("+runeSource[2].get_Name()+")";
            }
        }
        if (this.prof == "Unarmed Attacks") {
            let character = characterService.get_Character();
            if (character.get_FeatsTaken(0, character.level, "Diamond Fists").length && this.traits.includes("Forceful")) {
                dicenum += 1;
                explain += "\nDiamond Fists: Dice number +1";
            }
        }
        if (creature.type == "Companion") {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDice) {
                    dicenum += level.extraDice;
                    explain += "\n"+level.name+": Dice number +"+level.extraDice;
                }
            })
            if (creature.class.specializations.length) {
                    dicenum += 1;
                    explain += "\nSpecialized: Dice number +1";
            }
        }
        let dicesize = this.dicesize;
        //Monks get 1d6 for Fists instead of 1d4 via Powerful Fist; Stone Fist Elixir has the same effect.
        effectsService.get_AbsolutesOnThis(creature, this.name+" Dice Size")
            .concat(effectsService.get_AbsolutesOnThis(creature, this.weaponBase+" Dice Size"))
            .forEach(effect => {
                dicesize = parseInt(effect.setValue);
                explain += "\n"+effect.source+": Dice size d"+dicesize;
            })
        effectsService.get_RelativesOnThis(creature, this.name+" Dice Size")
        .concat(effectsService.get_RelativesOnThis(creature, this.weaponBase+" Dice Size"))
        .forEach(effect => {
            dicesize += parseInt(effect.value);
            explain += "\n"+effect.source+": Dice size d"+dicesize;
        })
        //Champions get increased dize size via Deific Weapon for unarmed attacks with d4 damage or simple weapons as long as they are their deity's favored weapon.
        if (((dicesize == 4 && this.prof == "Unarmed Attacks") || this.prof == "Simple Weapons") &&
            characterService.get_Features("Deific Weapon")[0]?.have(creature, characterService)) {
            let favoredWeapons: string[] = [];
            if (creature.type == "Character" && (creature as Character).class.deity) {
                favoredWeapons = characterService.get_Deities((creature as Character).class.deity)[0]?.favoredWeapon || [];
            }
            if (favoredWeapons.includes(this.name) || favoredWeapons.includes(this.weaponBase)) {
                dicesize = Math.max(Math.min(dicesize + 2, 12), 6);
                explain += "\nDeific Weapon: Dice size d"+dicesize;
            }
        }
        //Get the basic "xdy" string from the weapon's dice values
        var baseDice = dicenum + "d" + dicesize;
        //The Enfeebled condition affects all Strength damage
        let strEffects = effectsService.get_RelativesOnThis(creature, "Strength-based Checks and DCs");
        let strPenalty: {value:number, source:string, penalty:boolean}[] = [];
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push({value:parseInt(effect.value), source:effect.source, penalty:true});
            strPenaltySum += parseInt(effect.value);
        });
        //The Clumsy condition affects all Dexterity damage
        let dexEffects = effectsService.get_RelativesOnThis(creature, "Dexterity-based Checks and DCs");
        let dexPenalty: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:true});
            dexPenaltySum += parseInt(effect.value);
        });
        //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
        let abilityMod: number = 0;
        if (range == "ranged") {
            if (characterService.have_Trait(this, "Propulsive")) {
                if (str > 0) {
                    abilityMod = Math.floor(str / 2);
                    explain += "\nStrength Modifier (Propulsive): "+abilityMod;
                    if (strPenalty.length) {
                        strPenalty.forEach(singleStrPenalty => {
                            penalty.push(singleStrPenalty);
                            abilityMod += singleStrPenalty.value;
                            explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                        });
                    }
                } else if (str < 0) {
                    abilityMod = str;
                    explain += "\nStrength Modifier (Propulsive): "+abilityMod;
                    if (strPenalty.length) {
                        strPenalty.forEach(singleStrPenalty => {
                            penalty.push(singleStrPenalty);
                            abilityMod += singleStrPenalty.value;
                            explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                        });
                    }
                }
            } else if (characterService.have_Trait(this, "Thrown")) {
                abilityMod = str;
                explain += "\nStrength Modifier (Thrown): "+abilityMod;
                if (strPenalty.length) {
                    strPenalty.forEach(singleStrPenalty => {
                        penalty.push(singleStrPenalty);
                        abilityMod += singleStrPenalty.value;
                        explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                    });
                }
            }
        } else {
            //If the weapon is Finesse and you have the Thief Racket, you apply your Dexterity modifier to damage if it is higher.
            if (characterService.have_Trait(this, "Finesse") &&
                dex + dexPenaltySum > str + strPenaltySum &&
                creature.type == "Character" &&
                (creature as Character).get_FeatsTaken(1, creature.level, "Thief Racket").length) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Thief): "+abilityMod;
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
                if (strPenalty.length) {
                    strPenalty.forEach(singleStrPenalty => {
                        penalty.push(singleStrPenalty);
                        abilityMod += singleStrPenalty.value;
                        explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                    });
                }
            }
        }
        let featBonus: number = 0;
        //Weapon Specialization grants extra damage according to your proficiency.
        //For the Major Bestial Mutagen attacks, you gain Weapon Specialization, or greater if it already applies.
        if (characterService.get_Features().filter(feature => feature.name.includes("Weapon Specialization") && feature.have(creature, characterService)).length) {
            let greaterWeaponSpecialization = (characterService.get_Features().filter(feature => feature.name.includes("Greater Weapon Specialization") && feature.have(creature, characterService)).length > 0);
            switch (this.profLevel(creature, characterService, runeSource[1])) {
                case 4:
                    if (greaterWeaponSpecialization || ["Bestial Mutagen Jaws (Major)", "Bestial Mutagen Claw (Major)"].includes(this.name)) {
                        featBonus += 4;
                        explain += "\nGreater Weapon Specialization: 4";
                    } else {
                        featBonus += 2;
                        explain += "\nWeapon Specialization: 2";
                    }
                    break;
                case 6:
                    if (greaterWeaponSpecialization || ["Bestial Mutagen Jaws (Major)", "Bestial Mutagen Claw (Major)"].includes(this.name)) {
                        featBonus += 6;
                        explain += "\nGreater Weapon Specialization: 6";
                    } else {
                        featBonus += 3;
                        explain += "\nWeapon Specialization: 3";
                    }
                    break;
                case 8:
                    if (greaterWeaponSpecialization || ["Bestial Mutagen Jaws (Major)", "Bestial Mutagen Claw (Major)"].includes(this.name)) {
                        featBonus += 8;
                        explain += "\nGreater Weapon Specialization: 8";
                    } else {
                        featBonus += 4;
                        explain += "\nWeapon Specialization: 4";
                    }
                    break;
            }
        } else if (["Bestial Mutagen Jaws (Major)", "Bestial Mutagen Claw (Major)"].includes(this.name)) {
            featBonus += 2;
            explain += "\nWeapon Specialization: 2";
        }
        if (creature.type == "Companion") {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDamage) {
                    featBonus += level.extraDamage;
                    explain += "\n"+level.name+": "+level.extraDamage;
                    if (creature.class.specializations.length) {
                        featBonus += level.extraDamage;
                        explain += "\nSpecialized: "+level.extraDamage;
                    }
                }
            })
        }
        let effectBonus = 0;
        if (range == "melee") {
            effectsService.get_RelativesOnThis(creature, "Melee Damage").forEach(effect => {
                effectBonus += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + parseInt(effect.value);
            })
            if (this.traits.includes("Agile")) {
                effectsService.get_RelativesOnThis(creature, "Agile Melee Damage").forEach(effect => {
                    effectBonus += parseInt(effect.value);
                    explain += "\n" + effect.source + ": " + parseInt(effect.value);
                })
            } else {
                effectsService.get_RelativesOnThis(creature, "Non-Agile Melee Damage").forEach(effect => {
                    effectBonus += parseInt(effect.value);
                    explain += "\n" + effect.source + ": " + parseInt(effect.value);
                })
            }
        }
        
        effectsService.get_RelativesOnThis(creature, this.name + " Damage").forEach(effect => {
            effectBonus += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + parseInt(effect.value);
        })
        if (this.weaponBase) {
            effectsService.get_RelativesOnThis(creature, this.weaponBase + " Damage").forEach(effect => {
                effectBonus += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + parseInt(effect.value);
            })
        }

        effectsService.get_RelativesOnThis(creature, "Damage Rolls").forEach(effect => {
            effectBonus += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + parseInt(effect.value);
        })

        //Serene Mutagen reduces your weapon damage by the number of dice.
        if (this.prof == "Unarmed Attacks") {
            effectsService.get_RelativesOnThis(creature, "Unarmed Damage per Die").forEach(effect => {
                effectBonus += parseInt(effect.value) * dicenum;
                explain += "\n" + effect.source + ": " + (parseInt(effect.value) * dicenum);
            })
        } else {
            effectsService.get_RelativesOnThis(creature, "Weapon Damage per Die").forEach(effect => {
                effectBonus += parseInt(effect.value) * dicenum;
                explain += "\n" + effect.source + ": " + (parseInt(effect.value) * dicenum);
            })
        }
        
        
        let dmgBonus: number = abilityMod + featBonus + effectBonus;
        //Make a nice "+5" string from the Ability bonus if there is one, or else make it empty
        let dmgBonusTotal: string = (dmgBonus) ? ((dmgBonus >= 0) && "+") + dmgBonus : "";
        //Concatenate the strings for a readable damage die
        var dmgResult = baseDice + dmgBonusTotal + " " + this.dmgType + this.get_ExtraDamage(creature, characterService, range);
        explain = explain.substr(1);
        return [dmgResult, explain];
    }
    get_CritSpecialization(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, range: string) {
        let SpecializationGains: SpecializationGain[] = [];
        let specializations: Specialization[] = [];
        if (creature.type == "Character" && this.group) {
            let character = creature as Character;
            let runeSource: (Weapon|WornItem)[] = this.get_RuneSource(creature, range);
            let skillLevel = this.profLevel(creature, characterService, runeSource[1]);
            character.get_FeatsTaken(0, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
                .filter(feat => feat?.gainSpecialization?.length).forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (spec.group ? (this.group && spec.group.includes(this.group)) : true) &&
                        (spec.range ? (range && spec.range.includes(range)) : true) &&
                        (spec.name ? ((this.name && spec.name.includes(this.name)) || (this.weaponBase && spec.name.includes(this.weaponBase))) : true) &&
                        (spec.trait ? this.traits.filter(trait => spec.trait.includes(trait)).length : true) &&
                        (spec.proficiency ? (this.prof && spec.proficiency.includes(this.prof)) : true) &&
                        (spec.skillLevel ? skillLevel >= spec.skillLevel : true) &&
                        (spec.featreq ? characterService.get_FeatsAndFeatures(spec.featreq)[0]?.have(character, characterService) : true)
                    ))
            });
            SpecializationGains.forEach(critSpec => {
                let specs: Specialization[] = characterService.get_Specializations(this.group).map(spec => Object.assign(new Specialization(), spec));
                specs.forEach(spec => {
                    if (critSpec.condition) {
                        spec.desc = "(" + critSpec.condition + ") " + spec.desc;
                    }
                    if (!specializations.filter(existingspec => JSON.stringify(existingspec) == JSON.stringify(spec)).length) {
                        specializations.push(spec);
                    }
                });
            });
        }
        return specializations;
    }
}
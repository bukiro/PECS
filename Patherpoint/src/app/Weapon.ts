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
import { VirtualTimeScheduler } from 'rxjs';
import { SkillIncrease } from './SkillIncrease';

export class Weapon extends Equipment {
    public readonly _className: string = this.constructor.name;
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Equipment().save.concat([
        "parrying"
    ])
    //Weapons should be type "weapons" to be found in the database
    readonly type = "weapons";
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
        //Specific items (not moddable) don't profit from other item's runes.
        if (!this.moddable || this.moddable == "-") {
            return runeSource;
        }
        if (this.prof == "Unarmed Attacks") {
            let handwraps = creature.inventories[0].wornitems.filter(item => item.isHandwrapsOfMightyBlows && item.invested)
            if (handwraps.length) {
                runeSource = [handwraps[0], handwraps[0], handwraps[0]];
            }
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
        //There are a lot of ways to be trained with a weapon.
        //To determine the skill level, we have to find skills for the item's proficiency, its name, its weapon base and any of its traits.
        let levels: number[] = [];
        levels.push(characterService.get_Skills(creature, this.name)[0]?.level(creature, characterService, charLevel) || 0);
        levels.push(this.weaponBase ? characterService.get_Skills(creature, this.weaponBase)[0]?.level(creature, characterService, charLevel) : 0);
        levels.push(characterService.get_Skills(creature, this.prof)[0]?.level(creature, characterService, charLevel) || 0);
        levels.push(...this.traits.map(trait => characterService.get_Skills(creature, trait)[0]?.level(creature, characterService, charLevel) || 0))
        //Get the skill level by applying the result with the most increases, but no higher than 8.
        skillLevel = Math.min(Math.max(...levels), 8);
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
        let dexEffects = effectsService.get_RelativesOnThis(creature, "Dexterity Attacks");
        let dexPenalty: {value:number, setValue:string, source:string, penalty:boolean}[] = [];
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:true});
            dexPenaltySum += parseInt(effect.value);
        });
        //The Enfeebled condition affects all Strength attacks
        let strEffects = effectsService.get_RelativesOnThis(creature, "Strength Attacks");
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
        //Add absolute effects for this weapon
        effectsService.get_AbsolutesOnThis(creature, this.name).concat(effectsService.get_AbsolutesOnThis(creature, "All Checks")).forEach(effect => {
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
        //Add relative effects for this weapon
        let effectsSum: number = 0;
        let relatives: Effect[] = effectsService.get_RelativesOnThis(creature, this.name).concat(effectsService.get_RelativesOnThis(creature, "All Checks"));
        relatives.forEach(effect => {
            if (parseInt(effect.value) < 0) {
                penalties.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:true});
            } else {
                bonuses.push({value:parseInt(effect.value), setValue:"", source:effect.source, penalty:false});
            }
            effectsSum += parseInt(effect.value);
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
        let penalty: {value:number, source:string, penalty:boolean}[] = [];
        //Apply any mechanism that copy runes from another item, like Handwraps of Mighty Blows or Doubling Rings.
        //We set runeSource to the respective item and use it whenever runes are concerned.
        let runeSource: (Weapon|WornItem)[] = this.get_RuneSource(creature, range);
        //Add the striking rune or oil of potency effect of the runeSource.
        let dicenum = this.dicenum + runeSource[0].get_StrikingRune();
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
        //Monks get 1d6 for Fists instead of 1d4 via Powerful Fist
        if ((this.name == "Fist") && characterService.get_Features("Powerful Fist")[0].have(creature, characterService)) {
            dicesize = 6;
            explain += "\nPowerful Fist: Dice size d6";
        }
        //Champions get increased dize size via Deific Weapon for unarmed attacks with d4 damage or simple weapons
        if (((dicesize == 4 && this.prof == "Unarmed Attacks") || this.prof == "Simple Weapons") &&
            characterService.get_Features("Deific Weapon")[0]?.have(creature, characterService)) {
            let favoredWeapons: string[] = [];
            if (creature.type == "Character") {
                favoredWeapons = characterService.get_Deities((creature as Character).class.deity)[0]?.favoredWeapon;
            }
            if (favoredWeapons.includes(this.name) || favoredWeapons.includes(this.weaponBase)) {
                dicesize = Math.max(Math.min(dicesize + 2, 12), 6);
                explain += "\nPowerful Fist: Dice size d"+dicesize;
            }
        }
        //Get the basic "xdx" string from the weapon's dice values
        var baseDice = dicenum + "d" + dicesize;
        //The Enfeebled condition affects all Strength damage
        let strEffects = effectsService.get_RelativesOnThis(creature, "Strength Attacks");
        let strPenalty: {value:number, source:string, penalty:boolean}[] = [];
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push({value:parseInt(effect.value), source:effect.source, penalty:true});
            strPenaltySum += parseInt(effect.value);
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
        let featBonus: number = 0;
        if (characterService.get_Features().filter(feature => feature.name.includes("Weapon Specialization") && feature.have(creature, characterService)).length) {
            let greaterWeaponSpecialization = (characterService.get_Features().filter(feature => feature.name.includes("Greater Weapon Specialization") && feature.have(creature, characterService)).length > 0);
            switch (this.profLevel(creature, characterService, runeSource[1])) {
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
        let dmgBonus: number = abilityMod + featBonus;
        //Make a nice "+5" string from the Ability bonus if there is one, or else make it empty
        let dmgBonusTotal: string = (dmgBonus) ? ((dmgBonus >= 0) && "+") + dmgBonus : "";
        //Concatenate the strings for a readable damage die
        var dmgResult = baseDice + dmgBonusTotal + " " + this.dmgType + this.get_ExtraDamage(creature, characterService, range);
        explain = explain.substr(1);
        return [dmgResult, explain];
    }
    get_CritSpecialization(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService) {
        let specializations: Specialization[] = [];
        if (creature.type == "Character") {
            let character = creature as Character;
            character.get_FeatsTaken(0, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0]).filter(feat => feat?.critSpecialization).forEach(feat => {
                if (feat.critSpecialization.includes(this.group) || feat.critSpecialization.includes(this.prof) || (feat.critSpecialization.includes("melee") && this.melee) || (feat.critSpecialization.includes("ranged") && this.melee) || feat.critSpecialization.includes("All")) {
                    //If the only feat that gives you the critical specialization for this weapon is Ranger Weapon Expertise, a hint is added to each specialization that it only applies to the Hunted Prey.
                    //If the only feat that gives you the critical specialization for this weapon is Bard Weapon Expertise, a hint is added to each specialization that it only applies while a composition is active.
                    //If any more specializations should apply, they will overwrite these hints, which is expected and correct as long as no other specialization has limitations.
                    let huntedPreyOnly = (!specializations.length && feat.name == "Ranger Weapon Expertise")
                    let compositionOnly = (!specializations.length && feat.name == "Bard Weapon Expertise")
                    specializations = characterService.get_Specializations(this.group).map(spec => Object.assign(new Specialization(), spec));
                    if (huntedPreyOnly) {
                        specializations.forEach(spec => {
                            spec.desc = "(Hunted Prey only) "+spec.desc;
                        });
                    }
                    if (compositionOnly) {
                        specializations.forEach(spec => {
                            spec.desc = "(With composition active) "+spec.desc;
                        });
                    }
                }
            })
            //If you have both Monastic Weaponry and Brawling Focus, you gain critical specializations for Monk weapons.
            if (this.traits.includes("Monk") && character.get_FeatsTaken(0, character.level, "Monastic Weaponry").length && character.get_FeatsTaken(0, character.level, "Brawling Focus").length) {
                specializations.push(...characterService.get_Specializations(this.group));
            }
        }
        return specializations;
    }
}
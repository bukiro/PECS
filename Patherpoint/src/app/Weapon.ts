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

export class Weapon extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Weapons should be type "weapons" to be found in the database
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Equipment().save.concat([
        "_className",
        "parrying"
    ])
    readonly type = "weapons";
    //Weapons are usually moddable like a weapon. Weapons that cannot be modded should be set to ""
    moddable = "weapon" as ""|"weapon"|"armor"|"shield";
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
    //What proficiency is used? "Simple Weapons", "Unarmed"?
    public prof: string = "Simple Weapons";
    //Ranged range in ft - also add for thrown weapons
    //Weapons can have a melee and a ranged value, e.g. Daggers that can thrown
    public ranged: number = 0;
    //How many actions to reload this ranged weapon?
    public reload: string = "";
    get_RuneSource(creature: Character|AnimalCompanion|Familiar, range: string) {
        //Under certain circumstances, other items' runes are applied when calculating attack bonus or damage.
        //[0] is the item whose fundamental runes will count, [1] is the item whose property runes will count, and [2] is the item that causes this change.
        let runeSource: (Weapon|WornItem)[] = [this, this];
        if (this.prof == "Unarmed") {
            let handwraps = creature.inventory.wornitems.filter(item => item.isHandwrapsOfMightyBlows && item.invested)
            if (handwraps.length) {
                runeSource = [handwraps[0], handwraps[0], handwraps[0]];
            }
        }
        if (range == "melee" && this.moddable == "weapon") {
            let doublingRings = creature.inventory.wornitems.filter(item => item.isDoublingRings && item.data[1].value == this.id && item.invested);
            if (doublingRings.length) {
                if (doublingRings[0].data[0].value) {
                    let goldItem = creature.inventory.weapons.filter(weapon => weapon.id == doublingRings[0].data[0].value);
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
        if (this.prof == "Unarmed") {
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
        let weaponIncreases = creature.get_SkillIncreases(characterService, 0, charLevel, this.name);
        let profIncreases = creature.get_SkillIncreases(characterService, 0, charLevel, this.prof);
        //For Monk, Dwarf, Goblin etc. weapons, check if the character has any weapon proficiency that matches a trait of this weapon
        let traitLevels: number[] = [];
        this.traits.forEach(trait => {
            let skill = characterService.get_Skills(creature, trait, "Specific Weapon Proficiency");
            if (skill.length) {
                traitLevels.push(skill[0].level(creature, characterService));
            }
        })
        //Only count the highest of these proficiency (e.g. in case you have Monk weapons +4 and Dwarf weapons +2)
        let bestTraitLevel: number = Math.max(...traitLevels)
        //Add either the weapon category proficiency or the weapon proficiency, whichever is better
        skillLevel = Math.max(Math.min(weaponIncreases.length * 2, 8),Math.min(profIncreases.length * 2, 8),Math.min(bestTraitLevel, 8))
        //If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level, up to the highest proficiency you have.
        let bestSkillLevel: number = skillLevel;
        if (runeSource.propertyRunes.filter(rune => rune.name == "Ancestral Echoing").length) {
            //First, we get the highest proficiency...
            let skills: number[] = characterService.get_Skills(creature, "", "Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", "Specific Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel)));
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        return bestSkillLevel;
    }
    attack(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string) {
    //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let explain: string = "";
        let charLevel = characterService.get_Character().level;
        let str  = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService);
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService);
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
        let penalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        penalty.splice(0,1);
        let bonus: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        bonus.splice(0,1);
        //The Clumsy condition affects all Dexterity attacks
        let dexEffects = effectsService.get_EffectsOnThis(creature, "Dexterity Attacks");
        let dexPenalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        dexPenalty.splice(0,1);
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({value:parseInt(effect.value), source:effect.source, penalty:true});
            dexPenaltySum += parseInt(effect.value);
        });
        //The Enfeebled condition affects all Strength attacks
        let strEffects = effectsService.get_EffectsOnThis(creature, "Strength Attacks");
        let strPenalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        strPenalty.splice(0,1);
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push({value:parseInt(effect.value), source:effect.source, penalty:true});
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
                        penalty.push(singleStrPenalty);
                        abilityMod += singleStrPenalty.value;
                        explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                    });
                }
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
                if (strPenalty.length) {
                    strPenalty.forEach(singleStrPenalty => {
                        penalty.push(singleStrPenalty);
                        abilityMod += singleStrPenalty.value;
                        explain += "\n"+singleStrPenalty.source+": "+singleStrPenalty.value;
                    });
                }
            }
        }
        
        if (runeSource[0].potencyRune > 0) {
            explain += "\nPotency: "+runeSource[0].get_Potency(runeSource[0].potencyRune);
            if (runeSource[2]) {
                explain += "\n("+runeSource[2].get_Name()+")";
            }
        }
        //Add all effects for this weapon
        let effects: Effect[] = effectsService.get_EffectsOnThis(creature, this.name).concat(effectsService.get_EffectsOnThis(creature, "All Checks"));
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
        let attackResult = charLevelBonus + skillLevel + abilityMod + runeSource[0].potencyRune + effectsSum;
        explain = explain.substr(1);
        return [range, attackResult, explain, penalty.concat(bonus), penalty, bonus];
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
        return extraDamage;
    }
    damage(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string) {
    //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
    //Returns a string in the form of "1d6 +5"
        let explain: string = "";
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService);
        let penalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        penalty.splice(0,1);
        //Apply Handwraps of Mighty Blows, if equipped, to unarmed attacks
        //We replace "me" with the Handwraps and use "me" instead of "this" when runes are concerned.
        let runeSource: (Weapon|WornItem)[] = this.get_RuneSource(creature, range);
        let dicenum = this.dicenum + runeSource[0].strikingRune;
        if (runeSource[0].strikingRune > 0) {
            explain += "\n"+runeSource[0].get_Striking(runeSource[0].strikingRune)+": Dice number +"+runeSource[0].strikingRune;
            if (runeSource[2]) {
                explain += "\n("+runeSource[2].get_Name()+")";
            }
        }
        if (this.prof == "Unarmed") {
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
        //Get the basic "1d6" from the weapon's dice values
        var baseDice = dicenum + "d" + dicesize;
        //The Enfeebled condition affects all Strength damage
        let strEffects = effectsService.get_EffectsOnThis(creature, "Strength Attacks");
        let strPenalty: [{value?:number, source?:string, penalty?:boolean}] = [{}];
        strPenalty.splice(0,1);
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
        if (characterService.get_Features("Weapon Specialization")[0].have(creature, characterService)) {
            let greaterWeaponSpecialization = false;
            if (characterService.get_Features("Greater Weapon Specialization")[0].have(creature, characterService)) {
                greaterWeaponSpecialization = true;
            }
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
            character.get_FeatsTaken(0, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0]).filter(feat => feat.critSpecialization).forEach(feat => {
                if (feat.critSpecialization.includes(this.group) || feat.critSpecialization.includes(this.prof) || feat.critSpecialization.includes("All")) {
                    //If the only feat that gives you the critical specialization for this weapon is Ranger Weapon Expertise, a hint is added to each specialization that it only applies to the Hunted Prey.
                    //If any more specializations should apply, they will overwrite these hints, which is expected and correct as long as no other specialization has limitations.
                    let huntedPreyOnly = (!specializations.length && feat.name == "Ranger Weapon Expertise")
                    specializations = characterService.get_Specializations(this.group).map(spec => Object.assign(new Specialization(), spec));
                    if (huntedPreyOnly) {
                        specializations.forEach(spec => {
                            spec.desc = "(Hunted Prey only) "+spec.desc;
                        });
                    }
                }
            })
            if (this.traits.includes("Monk") && character.get_FeatsTaken(0, character.level, "Monastic Weaponry").length && character.get_FeatsTaken(0, character.level, "Brawling Focus").length) {
                specializations = characterService.get_Specializations(this.group);
            }
        }
        return specializations;
    }
}
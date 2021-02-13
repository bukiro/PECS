import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { WornItem } from './WornItem';
import { Equipment } from './Equipment';
import { WeaponRune } from './WeaponRune';
import { Specialization } from './Specialization';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Oil } from './Oil';
import { SpecializationGain } from './SpecializationGain';
import { AlchemicalPoison } from './AlchemicalPoison';
import { ProficiencyChange } from './ProficiencyChange';
import { Effect } from './Effect';
import { Creature } from './Creature';
import { Skill } from './Skill';

export class Weapon extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Weapons should be type "weapons" to be found in the database
    public type = "weapons";
    //Weapons are usually moddable like a weapon. Weapons that cannot be modded should be set to "-"
    moddable = "weapon" as "" | "-" | "weapon" | "armor" | "shield";
    //What type of ammo is used? (Bolts, arrows...)
    public ammunition: string = "";
    //What happens on a critical hit with this weapon?
    public criticalHint: string = ""
    //Number of dice for Damage: usually 1 for an unmodified weapon. Use 0 to notate exactly <dicesize> damage (e.g. 1 damage = 0d1).
    public dicenum: number = 1;
    //Size of the damage dice: usually 4-12
    public dicesize: number = 6;
    //What is the damage type? Usually S, B or P, but may include combinations"
    public dmgType: string = "";
    //Some weapons add additional damage like +1d4F. Use get_ExtraDamage() to read.
    private extraDamage: string = ""
    //The weapon group, needed for critical specialization effects
    public group: string = "";
    //How many hands are needed to wield this weapon?
    public hands: string = "";
    //Melee range in ft: 5 or 10 for weapons with Reach trait
    public melee: number = 0;
    //Store any poisons applied to this item. There should be only one poison at a time.
    public poisonsApplied: AlchemicalPoison[] = [];
    //What proficiency is used? "Simple Weapons", "Unarmed Attacks", etc.? Use get_Proficiency() to get the proficiency for numbers and effects.
    public prof: "Unarmed Attacks" | "Simple Weapons" | "Martial Weapons" | "Advanced Weapons" = "Simple Weapons";
    //Ranged range in ft - also add for thrown weapons
    //Weapons can have a melee and a ranged value, e.g. Daggers that can thrown
    public ranged: number = 0;
    //How many actions to reload this ranged weapon?
    public reload: string = "";
    //What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items.
    public weaponBase: string = "";
    //Giant Instinct Barbarians can wield larger weapons.
    public large: boolean = false;
    //Weapons with the Two-Hand trait can be wielded with two hands to increase their damage.
    public twohanded: boolean = false;
    //A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally.
    public bladeAlly: boolean = false;
    //A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune.
    public battleforged: boolean = false;
    //Dexterity-based melee attacks force you to use dexterity for your attack modifier.
    public dexterityBased: boolean = false;
    get_RuneSource(creature: Creature, range: string) {
        //Under certain circumstances, other items' runes are applied when calculating attack bonus or damage.
        //[0] is the item whose fundamental runes will count, [1] is the item whose property runes will count, and [2] is the item that causes this change.
        let runeSource: (Weapon | WornItem)[] = [this, this];
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
    get_Traits(characterService: CharacterService, creature: Creature) {
        //characterService is not needed for armors, but for other types of item.
        //Test for certain feats that give traits to unarmed attacks.
        let traits: string[] = JSON.parse(JSON.stringify(this.traits));
        if (this.prof == "Unarmed Attacks") {
            if (creature.type == "Character") {
                if (!this.traits.includes("Forceful") && (creature as Character).get_FeatsTaken(0, creature.level, "Diamond Fists").length) {
                    traits = traits.concat("Forceful");
                }
                if (!this.traits.includes("Deadly d12") && (creature as Character).get_FeatsTaken(0, creature.level, "Golden Body").length) {
                    traits = traits.concat("Deadly d12");
                }
                if ((this.name == "Razortooth Goblin Jaws") && (creature as Character).get_FeatsTaken(0, creature.level, "Fang Sharpener (Razortooth Goblin)").length) {
                    traits = traits.filter(trait => trait != "Finesse");
                }
                if (this.name == "Lizardfolk Claw") {
                    //The Razor Claws feat adds Versatile P to the Lizardfolk Claw. This means we also have to change the dmgType (in a somewhat brute force way).
                    if ((creature as Character).get_FeatsTaken(0, creature.level, "Razor Claws").length) {
                        traits = traits.concat("Versatile P");
                        if (this.dmgType != "S/P") {
                            this.dmgType = "S/P"
                        }
                    } else {
                        if (this.dmgType != "S") {
                            this.dmgType = "S"
                        }
                    }
                }
            }
        }
        if (this.melee) {
            //Find and apply effects that give this weapon reach.
            let effectsService = characterService.effectsService;
            let reach = parseInt(traits.find(trait => trait.includes("Reach"))?.split(" ")[1]) || 5;
            let newReach = reach;
            let list = [
                "Reach",
                this.name + " Reach",
                this.weaponBase + " Reach",
            ]
            effectsService.get_AbsolutesOnThese(creature, list)
                .forEach(effect => {
                    newReach = parseInt(effect.setValue);
                })
            effectsService.get_RelativesOnThese(creature, list)
                .forEach(effect => {
                    newReach += parseInt(effect.value);
                })
            if (newReach != reach) {
                if (newReach == 5 || newReach == 0) {
                    traits = traits.filter(trait => !trait.includes("Reach"));
                } else {
                    let reachString: string = traits.find(trait => trait.includes("Reach"));
                    if (reachString) {
                        traits[traits.indexOf(reachString)] = "Reach " + newReach + " feet";
                    } else {
                        traits.push("Reach " + newReach + " feet");
                    }
                }
            }
        }
        return traits;
    }
    get_Proficiency(creature: Character | AnimalCompanion, characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        let proficiency = this.prof;
        //Some feats allow you to apply another proficiency to certain weapons, e.g.:
        // "For the purpose of determining your proficiency, martial goblin weapons are simple weapons and advanced goblin weapons are martial weapons."
        let proficiencyChanges: ProficiencyChange[] = [];
        if (creature.type == "Character") {
            let character = creature as Character;
            characterService.get_FeatsAndFeatures()
                .filter(feat => feat.changeProficiency.length && feat.have(character, characterService, charLevel, false))
                .forEach(feat => {
                    proficiencyChanges.push(...feat.changeProficiency.filter(change =>
                        (change.name ? this.name.toLowerCase() == change.name.toLowerCase() : true) &&
                        (change.trait ? this.traits.filter(trait => change.trait.includes(trait)).length : true) &&
                        (change.proficiency ? (this.prof && change.proficiency == this.prof) : true) &&
                        (change.group ? (this.group && change.group == this.group) : true)
                    ))
                });
            let proficiencies: string[] = proficiencyChanges.map(change => change.result);
            //Set the resulting proficiency to the best result by setting it in order of worst to best.
            if (proficiencies.includes("Advanced Weapons")) {
                proficiency = "Advanced Weapons";
            }
            if (proficiencies.includes("Martial Weapons")) {
                proficiency = "Martial Weapons";
            }
            if (proficiencies.includes("Simple Weapons")) {
                proficiency = "Simple Weapons";
            }
            if (proficiencies.includes("Unarmed Attacks")) {
                proficiency = "Unarmed Attacks";
            }
        }
        return proficiency;
    }
    profLevel(creature: Character | AnimalCompanion, characterService: CharacterService, runeSource: Weapon | WornItem, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let prof = this.get_Proficiency(creature, characterService, charLevel);
        //There are a lot of ways to be trained with a weapon.
        //To determine the skill level, we have to find skills for the item's proficiency, its name, its weapon base and any of its traits.
        let levels: number[] = [];
        //Weapon name, e.g. Demon Sword.
        let nameSkill: Skill = new Skill("", this.name, "Specific Weapon Proficiency");
        levels.push((characterService.get_Skills(creature, this.name)[0] || nameSkill).level(creature, characterService, charLevel) || 0);
        //Weapon base, e.g. Longsword.
        let baseSkill: Skill = new Skill("", this.weaponBase, "Specific Weapon Proficiency");
        levels.push(this.weaponBase ? (characterService.get_Skills(creature, this.weaponBase)[0] || baseSkill).level(creature, characterService, charLevel) : 0);
        //Proficiency and Group, e.g. Martial Sword.
        //There are proficiencies for "Simple Sword" or "Advanced Bow" that we need to consider, so we build that phrase here.
        let profAndGroup = prof.split(" ")[0] + " " + this.group;
        let profAndGroupSkill: Skill = new Skill("", profAndGroup, "Specific Weapon Proficiency");
        levels.push((characterService.get_Skills(creature, profAndGroup)[0] || profAndGroupSkill).level(creature, characterService, charLevel) || 0);
        //Proficiency, e.g. Martial Weapons.
        levels.push(characterService.get_Skills(creature, prof)[0]?.level(creature, characterService, charLevel) || 0);
        //Any traits, e.g. Monk.
        levels.push(...this.traits.map(trait => (characterService.get_Skills(creature, trait)[0] || new Skill("", trait, "Specific Weapon Proficiency")).level(creature, characterService, charLevel) || 0))
        //Get the skill level by applying the result with the most increases, but no higher than 8.
        skillLevel = Math.min(Math.max(...levels.filter(level => level != undefined)), 8);
        //If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level, up to the highest proficiency you have.
        let bestSkillLevel: number = skillLevel;
        if (runeSource.propertyRunes.some(rune => rune.name == "Ancestral Echoing")) {
            //First, we get all the weapon proficiencies...
            let skills: number[] = characterService.get_Skills(creature, "", "Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", "Specific Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel)));
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        //If you have an oil applied that emulates an Ancestral Echoing rune, apply the same rule (there is no such oil, but things can change)
        if (this.oilsApplied.some(oil => oil.runeEffect && oil.runeEffect.name == "Ancestral Echoing")) {
            //First, we get all the weapon proficiencies...
            let skills: number[] = characterService.get_Skills(creature, "", "Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", "Specific Weapon Proficiency").map(skill => skill.level(creature, characterService, charLevel)));
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        return bestSkillLevel;
    }
    attack(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string) {
        //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let explain: string = "";
        let charLevel = characterService.get_Character().level;
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        let runeSource: (Weapon | WornItem)[] = this.get_RuneSource(creature, range);
        let skillLevel = this.profLevel(creature, characterService, runeSource[1]);
        if (skillLevel) {
            explain += "\nProficiency: " + skillLevel;
        }
        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel : 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: " + charLevelBonus;
        }
        let penalties: { value: number, setValue: string, source: string, penalty: boolean, type: string }[] = [];
        let bonuses: { value: number, setValue: string, source: string, penalty: boolean, type: string }[] = [];
        let absolutes: { value: number, setValue: string, source: string, penalty: boolean, type: string }[] = [];
        //Calculate dexterity and strength penalties for the decision on which to use. They are not immediately applied.
        //The Clumsy condition affects all Dexterity attacks.
        let dexEffects = effectsService.get_RelativesOnThis(creature, "Dexterity-based Checks and DCs");
        let dexPenalty: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
            dexPenaltySum += parseInt(effect.value);
        });
        //The Enfeebled condition affects all Strength attacks
        let strEffects = effectsService.get_RelativesOnThis(creature, "Strength-based Checks and DCs");
        let strPenalty: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
            strPenaltySum += parseInt(effect.value);
        });
        let dexUsed: boolean = false;
        let strUsed: boolean = false;
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let abilityMod: number = 0;
        if (range == "ranged") {
            if (characterService.have_Trait(this, "Brutal")) {
                abilityMod = str;
                explain += "\nStrength Modifier (Brutal): " + abilityMod;
                strUsed = true;

            } else {
                abilityMod = dex;
                explain += "\nDexterity Modifier: " + abilityMod;
                dexUsed = true;
            }
        } else {
            if (characterService.have_Trait(this, "Finesse") && dex + dexPenaltySum > str + strPenaltySum) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Finesse): " + abilityMod;
                dexUsed = true;
            } else if (this.dexterityBased) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Dexterity-based): " + abilityMod;
                dexUsed = true;
            } else {
                abilityMod = str;
                explain += "\nStrength Modifier: " + abilityMod;
                strUsed = true;
            }
        }
        //Add up all modifiers before effects and item bonus
        let attackResult = charLevelBonus + skillLevel + abilityMod;
        let abilityName: string = "";
        if (strUsed) {
            abilityName = "Strength";
        }
        if (dexUsed) {
            abilityName = "Dexterity";
        }
        let prof = this.get_Proficiency(creature, characterService, charLevel);
        //Create names list for effects
        let namesList = [
            this.name,
            "Attack Rolls",
            "All Checks and DCs",
            //"Sword Attack Rolls", "Club Attack Rolls"
            this.group + " Attack Rolls",
            //"Unarmed Attacks Attack Rolls", "Simple Weapons Attack Rolls"
            prof + " Attack Rolls",
            //"Unarmed Attack Rolls", "Simple Attack Rolls"
            prof.split(" ")[0] + " Attack Rolls",
            //"Weapons Attack Rolls", also "Attacks Attack Rolls", but that's unlikely to be needed
            prof.split(" ")[1] + " Attack Rolls",
            //"Simple Sword Attack Rolls", "Martial Club Attack Rolls" etc.
            prof.split(" ")[0] + this.group + " Attack Rolls",
            //"Simple Longsword Attack Rolls", "Unarmed Fist Attack Rolls" etc.
            prof.split(" ")[0] + this.weaponBase + " Attack Rolls",
            //"Melee Attack Rolls", "Ranged Attack Rolls"
            range + " Attack Rolls",
            //"Strength-based Checks and DCs"
            abilityName + "-based Checks and DCs"
        ];
        let traits = this.get_Traits(characterService, creature);
        traits.forEach(trait => {
            if (trait.includes(" ft")) {
                namesList.push(trait.split(" ")[0] + " Attack Rolls")
            } else {
                namesList.push(trait + " Attack Rolls");
            }
        })
        if (!traits.includes("Agile")) {
            namesList.push("Non-Agile Attack Rolls");
        }
        //Add absolute effects
        effectsService.get_AbsolutesOnThese(creature, namesList)
            .forEach(effect => {
                if (!effect.hide) {
                    absolutes.push({ value: 0, setValue: effect.setValue, source: effect.source, penalty: false, type: effect.type });
                }
                attackResult = parseInt(effect.setValue)
                explain = effect.source + ": " + effect.setValue;
            });
        let effectsSum: number = 0;
        //Add relative effects, including potency bonus and shoddy penalty
        //Generate potency bonus
        let potencyRune: number = runeSource[0].get_PotencyRune();
        let calculatedEffects: Effect[] = []
        if (potencyRune) {
            let source = "Potency"
            //If you're getting the potency because of another item (like Doubling Rings), name it here
            if (runeSource[2]) {
                source = "Potency (" + runeSource[2].get_Name() + ")";
            }
            calculatedEffects.push(new Effect(creature.type, "item", this.name, potencyRune.toString(), "", false, source, false, true, true, 0))
        }
        if (runeSource[0].battleforged) {
            let source = "Battleforged"
            //If you're getting the battleforged bonus because of another item (like Handwraps of Mighty Blows), name it here
            if (runeSource[2]) {
                source = "Battleforged (" + runeSource[2].get_Name() + ")";
            }
            calculatedEffects.push(new Effect(creature.type, "item", this.name, "+1", "", false, source, false, true, true, 0))
        }
        //Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.get_Feats("Junk Tinker")[0]?.have(creature, characterService) && this.crafted) {
            explain += "\nShoddy (canceled by Junk Tinker): -0";
        } else if (this.shoddy) {
            calculatedEffects.push(new Effect(creature.type, "item", this.name, "-2", "", false, "Shoddy", true, true, true, 0))
        }
        //Because of the Potency and Shoddy Effects, we need to filter the types a second time, even though get_RelativesOnThese comes pre-filtered.
        effectsService.get_TypeFilteredEffects(
            calculatedEffects
                .concat(effectsService.get_RelativesOnThese(creature, namesList)
                ), false)
            .forEach(effect => {
                if (parseInt(effect.value) < 0 && !effect.hide) {
                    penalties.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true, type: effect.type });
                } else if (!effect.source.includes("Potency") && !effect.hide) {
                    //Don't turn the number green just from Potency.
                    bonuses.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false, type: effect.type });
                }
                effectsSum += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
        //Add up all modifiers and return the attack bonus for this attack
        attackResult += effectsSum;
        explain = explain.trim();
        return [range, attackResult, explain, penalties.concat(bonuses).concat(absolutes), penalties, bonuses, absolutes];
    }
    get_ExtraDamage(creature: Creature, characterService: CharacterService, range: string) {
        let extraDamage: string = "";
        if (this.extraDamage) {
            extraDamage += "\n" + this.extraDamage;
        }
        let runeSource = this.get_RuneSource(creature, range);
        runeSource[1].propertyRunes
            .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
            .forEach((weaponRune: WeaponRune) => {
                extraDamage += "\n" + weaponRune.extraDamage;
            });
        this.oilsApplied
            .filter((oil: Oil) => oil.runeEffect && oil.runeEffect.extraDamage)
            .forEach((oil: Oil) => {
                extraDamage += "\n" + oil.runeEffect.extraDamage;
            });
        if (runeSource[1].bladeAlly) {
            runeSource[1].bladeAllyRunes
                .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
                .forEach((weaponRune: WeaponRune) => {
                    extraDamage += "\n" + weaponRune.extraDamage;
                });
        }
        return extraDamage;
    }
    damage(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string) {
        //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
        //Returns a string in the form of "1d6+5 B\n+1d6 Fire"
        if (!this.dicenum && !this.dicesize && !this.extraDamage) {
            return ["0", "", [], [], []];
        }
        let diceExplain: string = "Base dice: " + this.dicenum + "d" +this.dicesize;
        let bonusExplain: string = "";
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        let penalties: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let bonuses: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let absolutes: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let prof = this.get_Proficiency(creature, characterService);
        //Apply any mechanism that copy runes from another item, like Handwraps of Mighty Blows or Doubling Rings.
        //We set runeSource to the respective item and use it whenever runes are concerned.
        let runeSource: (Weapon | WornItem)[] = this.get_RuneSource(creature, range);
        //Add the striking rune or oil of potency effect of the runeSource.
        let dicenum = this.dicenum;
        if (dicenum) {
            dicenum = Math.max(dicenum, 1 + runeSource[0].get_StrikingRune());
        }
        //Determine the dice number - Striking and animal specialization first, then effects.
        //Only explain Striking if it's actually better than your base dice.
        if (runeSource[0].get_StrikingRune() + 1 > this.dicenum) {
            diceExplain += "\n" + runeSource[0].get_Striking(runeSource[0].get_StrikingRune()) + (runeSource[2] ? "(" + runeSource[2].get_Name() + ")" : "") + ": Dice number " + (runeSource[0].get_StrikingRune() + 1);
        }
        if (this.prof == "Unarmed Attacks") {
            let character = characterService.get_Character();
            if (character.get_FeatsTaken(0, character.level, "Diamond Fists").length && this.traits.includes("Forceful")) {
                dicenum += 1;
                diceExplain += "\nDiamond Fists: Dice number +1";
            }
        }
        if (creature.type == "Companion") {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDice) {
                    dicenum += level.extraDice;
                    diceExplain += "\n" + level.name + ": Dice number +" + level.extraDice;
                }
            })
            if (creature.class.specializations.length) {
                dicenum += 1;
                diceExplain += "\nSpecialized: Dice number +1";
            }
        }
        effectsService.get_AbsolutesOnThese(creature, [
            "Dice Number",
            this.name + " Dice Number",
            //"Longsword Dice Number", "Fist Dice Number" etc.
            this.weaponBase + " Dice Number",
            //"Sword Dice Number", "Club Dice Number"
            this.group + " Dice Number",
            //"Unarmed Attacks Dice Number", "Simple Weapons Dice Number" etc.
            prof + " Dice Number",
            //"Unarmed Dice Number", "Simple Dice Number" etc.
            prof.split(" ")[0] + " Dice Number",
            //"Weapons Dice Number", also "Attacks Dice Number", but that's unlikely to be needed
            prof.split(" ")[1] + " Dice Number",
            //"Simple Sword Dice Number", "Martial Club Dice Number" etc.
            prof.split(" ")[0] + this.group + " Dice Number",
            //"Simple Longsword Dice Number", "Unarmed Fist Dice Number" etc.
            prof.split(" ")[0] + this.weaponBase + " Dice Number"
        ]).forEach(effect => {
            if (!effect.hide) {
                absolutes.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false });
            }
            dicenum = parseInt(effect.setValue);
            diceExplain += "\n" + effect.source + ": Dice number " + dicenum;
        })
        let dicenumMultiplier = 1;
        effectsService.get_AbsolutesOnThese(creature, [
            "Dice Number Multiplier",
            this.name + " Dice Number Multiplier",
            //"Longsword Dice Number Multiplier", "Fist Dice Number Multiplier" etc.
            this.weaponBase + " Dice Number Multiplier",
            //"Sword Dice Number Multiplier", "Club Dice Number Multiplier"
            this.group + " Dice Number Multiplier",
            //"Unarmed Attacks Dice Number Multiplier", "Simple Weapons Dice Number Multiplier" etc.
            prof + " Dice Number Multiplier",
            //"Unarmed Dice Number Multiplier", "Simple Dice Number Multiplier" etc.
            prof.split(" ")[0] + " Dice Number Multiplier",
            //"Weapons Dice Number Multiplier", also "Attacks Dice Number Multiplier", but that's unlikely to be needed
            prof.split(" ")[1] + " Dice Number Multiplier",
            //"Simple Sword Dice Number Multiplier", "Martial Club Dice Number Multiplier" etc.
            prof.split(" ")[0] + this.group + " Dice Number Multiplier",
            //"Simple Longsword Dice Number Multiplier", "Unarmed Fist Dice Number Multiplier" etc.
            prof.split(" ")[0] + this.weaponBase + " Dice Number Multiplier"
        ]).forEach(effect => {
            dicenumMultiplier = parseInt(effect.setValue);
            diceExplain += "\n" + effect.source + ": Dice number multiplier " + dicenumMultiplier;
        })
        effectsService.get_RelativesOnThese(creature, [
            "Dice Number Multiplier",
            this.name + " Dice Number Multiplier",
            //"Longsword Dice Number Multiplier", "Fist Dice Number Multiplier" etc.
            this.weaponBase + " Dice Number Multiplier",
            //"Sword Dice Number Multiplier", "Club Dice Number Multiplier"
            this.group + " Dice Number Multiplier",
            //"Unarmed Attacks Dice Number Multiplier", "Simple Weapons Dice Number Multiplier" etc.
            prof + " Dice Number Multiplier",
            //"Unarmed Dice Number Multiplier", "Simple Dice Number Multiplier" etc.
            prof.split(" ")[0] + " Dice Number Multiplier",
            //"Weapons Dice Number Multiplier", also "Attacks Dice Number Multiplier", but that's unlikely to be needed
            prof.split(" ")[1] + " Dice Number Multiplier",
            //"Simple Sword Dice Number Multiplier", "Martial Club Dice Number Multiplier" etc.
            prof.split(" ")[0] + this.group + " Dice Number Multiplier",
            //"Simple Longsword Dice Number Multiplier", "Unarmed Fist Dice Number Multiplier" etc.
            prof.split(" ")[0] + this.weaponBase + " Dice Number Multiplier"
        ]).forEach(effect => {
            dicenumMultiplier += parseInt(effect.value);
            diceExplain += "\n" + effect.source + ": Dice number multiplier " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
        })
        dicenum *= dicenumMultiplier;
        effectsService.get_RelativesOnThese(creature, [
            "Dice Number",
            this.name + " Dice Number",
            //"Longsword Dice Number", "Fist Dice Number" etc.
            this.weaponBase + " Dice Number",
            //"Sword Dice Number", "Club Dice Number"
            this.group + " Dice Number",
            //"Unarmed Attacks Dice Number", "Simple Weapons Dice Number" etc.
            prof + " Dice Number",
            //"Unarmed Dice Number", "Simple Dice Number" etc.
            prof.split(" ")[0] + " Dice Number",
            //"Weapons Dice Number", also "Attacks Dice Number", but that's unlikely to be needed
            prof.split(" ")[1] + " Dice Number",
            //"Simple Sword Dice Number", "Martial Club Dice Number" etc.
            prof.split(" ")[0] + this.group + " Dice Number",
            //"Simple Longsword Dice Number", "Unarmed Fist Dice Number" etc.
            prof.split(" ")[0] + this.weaponBase + " Dice Number"
        ]).forEach(effect => {
            if (parseInt(effect.value) < 0 && !effect.hide) {
                penalties.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
            } else if (!effect.hide) {
                bonuses.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false });
            }
            dicenum += parseInt(effect.value);
            diceExplain += "\n" + effect.source + ": Dice number " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
        })
        //Determine the dice size.
        let dicesize = this.dicesize;
        //Champions get increased dice size via Deific Weapon for unarmed attacks with d4 damage or simple weapons as long as they are their deity's favored weapon.
        if (((dicesize == 4 && this.prof == "Unarmed Attacks") || this.prof == "Simple Weapons") &&
            characterService.get_Features("Deific Weapon")[0]?.have(creature, characterService)) {
            let favoredWeapons: string[] = [];
            if (creature.type == "Character" && (creature as Character).class.deity) {
                favoredWeapons = characterService.get_Deities((creature as Character).class.deity)[0]?.favoredWeapon || [];
            }
            if (favoredWeapons.includes(this.name) || favoredWeapons.includes(this.weaponBase)) {
                dicesize = Math.max(Math.min(dicesize + 2, 12), 6);
                diceExplain += "\nDeific Weapon: Dice size d" + dicesize;
            }
        }
        //Weapons with the Two-Hand trait get to change their dice size if they are wielded with two hands.
        if (this.twohanded) {
            this.get_Traits(characterService, creature).filter(trait => trait.includes("Two-Hand")).forEach(trait => {
                let twoHandedDiceSize = parseInt(trait.substr(10))
                if (twoHandedDiceSize) {
                    if (twoHandedDiceSize > dicesize) {
                        dicesize = twoHandedDiceSize;
                        diceExplain += "\nTwo-Hand: Dice size d" + dicesize;
                    }
                }
            })
        }
        //Apply dice size effects.
        effectsService.get_AbsolutesOnThese(creature, [
            "Dice Size",
            this.name + " Dice Size",
            //"Longsword Dice Size", "Fist Dice Size" etc.
            this.weaponBase + " Dice Size",
            //"Sword Dice Size", "Club Dice Size"
            this.group + " Dice Size",
            //"Unarmed Attacks Dice Size", "Simple Weapons Dice Size" etc.
            prof + " Dice Size",
            //"Unarmed Dice Size", "Simple Dice Size" etc.
            prof.split(" ")[0] + " Dice Size",
            //"Weapons Dice Size", also "Attacks Dice Size", but that's unlikely to be needed
            prof.split(" ")[1] + " Dice Size",
            //"Simple Sword Dice Size", "Martial Club Dice Size" etc.
            prof.split(" ")[0] + this.group + " Dice Size",
            //"Simple Longsword Dice Size", "Unarmed Fist Dice Size" etc.
            prof.split(" ")[0] + this.weaponBase + " Dice Size",
        ]).forEach(effect => {
            if (!effect.hide) {
                absolutes.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false });
            }
            dicesize = parseInt(effect.setValue);
            diceExplain += "\n" + effect.source + ": Dice size d" + dicesize;
        })
        effectsService.get_RelativesOnThese(creature, [
            "Dice Size",
            this.name + " Dice Size",
            //"Longsword Dice Size", "Fist Dice Size" etc.
            this.weaponBase + " Dice Size",
            //"Sword Dice Size", "Club Dice Size"
            this.group + " Dice Size",
            //"Unarmed Attacks Dice Size", "Simple Weapons Dice Size" etc.
            prof + " Dice Size",
            //"Unarmed Dice Size", "Simple Dice Size" etc.
            prof.split(" ")[0] + " Dice Size",
            //"Weapons Dice Size", also "Attacks Dice Size", but that's unlikely to be needed
            prof.split(" ")[1] + " Dice Size",
            //"Simple Sword Dice Size", "Martial Club Dice Size" etc.
            prof.split(" ")[0] + this.group + " Dice Size",
            //"Simple Longsword Dice Size", "Unarmed Fist Dice Size" etc.
            prof.split(" ")[0] + this.weaponBase + " Dice Size",
        ]).forEach(effect => {
            if (parseInt(effect.value) < 0 && !effect.hide) {
                penalties.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
            } else if (!effect.hide) {
                bonuses.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false });
            }
            dicesize += parseInt(effect.value);
            //Don't raise dice size over 12.
            dicesize = Math.min(12, dicesize);
            diceExplain += "\n" + effect.source + ": Dice size d" + dicesize;
        })
        //Get the basic "#d#" string from the weapon's dice values, unless dicenum is 0 or null (for instance some weapons deal exactly 1 base damage, which is represented by 0d1)
        var baseDice = (dicenum ? dicenum + "d" : "") + dicesize;
        //Calculate dexterity and strength penalties for the decision on which to use. They are not immediately applied.
        //The Enfeebled condition affects all Strength damage
        let strEffects = effectsService.get_RelativesOnThis(creature, "Strength-based Checks and DCs");
        let strPenalty: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
            strPenaltySum += parseInt(effect.value);
        });
        //The Clumsy condition affects all Dexterity damage
        let dexEffects = effectsService.get_RelativesOnThis(creature, "Dexterity-based Checks and DCs");
        let dexPenalty: { value: number, setValue: string, source: string, penalty: boolean }[] = [];
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
            dexPenaltySum += parseInt(effect.value);
        });
        let strUsed: boolean = false;
        let dexUsed: boolean = false;
        //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
        let abilityMod: number = 0;
        if (range == "ranged") {
            if (characterService.have_Trait(this, "Propulsive")) {
                if (str > 0) {
                    abilityMod = Math.floor(str / 2);
                    bonusExplain += "\nStrength Modifier (Propulsive): Bonus damage " + (abilityMod >= 0 ? "+" : "") + abilityMod;
                    strUsed = true;
                } else if (str < 0) {
                    abilityMod = str;
                    bonusExplain += "\nStrength Modifier (Propulsive): Bonus damage " + (abilityMod >= 0 ? "+" : "") + abilityMod;
                    strUsed = true;
                }
            } else if (characterService.have_Trait(this, "Thrown")) {
                abilityMod = str;
                bonusExplain += "\nStrength Modifier (Thrown): Bonus damage " + (abilityMod >= 0 ? "+" : "") + abilityMod;
                strUsed = true;
            }
        } else {
            //If the weapon is Finesse and you have the Thief Racket, you apply your Dexterity modifier to damage if it is higher.
            if (characterService.have_Trait(this, "Finesse") &&
                dex + dexPenaltySum > str + strPenaltySum &&
                creature.type == "Character" &&
                (creature as Character).get_FeatsTaken(1, creature.level, "Thief Racket").length) {
                abilityMod = dex;
                bonusExplain += "\nDexterity Modifier (Thief): Bonus damage " + (abilityMod >= 0 ? "+" : "") + abilityMod;
                dexUsed = true;
            } else if (this.dexterityBased) {
                abilityMod = dex;
                bonusExplain += "\nDexterity Modifier (Dexterity-based): Bonus damage " + (abilityMod >= 0 ? "+" : "") + abilityMod;
                dexUsed = true;
            } else {
                abilityMod = str;
                bonusExplain += "\nStrength Modifier: Bonus damage " + (abilityMod >= 0 ? "+" : "") + abilityMod;
                strUsed = true;
            }
        }
        let featBonus: number = 0;
        if (creature.type == "Companion") {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDamage) {
                    featBonus += level.extraDamage;
                    bonusExplain += "\n" + level.name + ": Bonus Damage +" + level.extraDamage;
                    if (creature.class.specializations.length) {
                        featBonus += level.extraDamage;
                        bonusExplain += "\nSpecialized: Bonus Damage +" + level.extraDamage;
                    }
                }
            })
        }
        let dmgBonus: number = abilityMod + featBonus;
        let profLevel = this.profLevel(creature, characterService, runeSource[1]);
        let list = [
            "Damage Rolls",
            this.name + " Damage",
            //"Longsword Damage", "Fist Melee Damage"
            this.weaponBase + " Damage",
            //"Melee Damage", "Ranged Damage"
            range + " Damage"
        ];
        if (this.traits.includes("Agile")) {
            //"Agile Large Melee Weapon Damage"
            if (this.large) {
                list.push("Agile Large " + range + " Weapon Damage");
            }
            //"Agile Melee Damage"
            list.push("Agile " + range + " Damage");
            if ((range == "ranged") && this.traits.some(trait => trait.includes("Thrown"))) {
                //"Agile Thrown Large Weapon Damage"
                if (this.large) {
                    list.push("Agile Thrown Large Weapon Damage")
                }
                //"Agile Thrown Weapon Damage"
                list.push("Agile Thrown Weapon Damage");
            }
        } else {
            //"Non-Agile Large Melee Weapon Damage"
            if (this.large) {
                list.push("Non-Agile Large " + range + " Weapon Damage");
            }
            //"Non-Agile Melee Damage"
            list.push("Non-Agile " + range + " Damage");
            if ((range == "ranged") && this.traits.some(trait => trait.includes("Thrown"))) {
                //"Non-Agile Thrown Large Weapon Damage"
                if (this.large) {
                    list.push("Non-Agile Thrown Large Weapon Damage")
                }
                //"Non-Agile Thrown Weapon Damage"
                list.push("Non-Agile Thrown Weapon Damage");
            }
        }
        effectsService.get_AbsolutesOnThese(creature, list)
            .forEach(effect => {
                if (!effect.hide) {
                    absolutes.push({ value: 0, setValue: effect.setValue, source: effect.source, penalty: false })
                }
                dmgBonus = parseInt(effect.setValue);
                bonusExplain = "\n" + effect.source + ": Bonus damage " + parseInt(effect.setValue);
            })
        let effectBonus = 0;
        let abilityName: string = "";
        if (strUsed) {
            abilityName = "Strength";
        }
        if (dexUsed) {
            abilityName = "Dexterity";
        }
        //"Strength-based Checks and DCs"
        list.push(abilityName + "-based Checks and DCs");
        if (this.prof == "Unarmed Attacks") {
            list.push("Unarmed Damage per Die");
        } else {
            list.push("Weapon Damage per Die");
        }
        switch (profLevel) {
            case 2:
                list.push("Trained Proficiency Attack Damage")
                list.push("Trained " + this.name + " Attack Damage")
                break;
            case 4:
                list.push("Expert Proficiency Attack Damage")
                list.push("Expert " + this.name + " Damage")
                break;
            case 6:
                list.push("Master Proficiency Attack Damage")
                list.push("Master " + this.name + " Damage")
                break;
            case 8:
                list.push("Legendary Proficiency Attack Damage")
                list.push("Legendary " + this.name + " Damage")
                break;
        }
        effectsService.get_RelativesOnThese(creature, list)
            .forEach(effect => {
                if (parseInt(effect.value) < 0 && !effect.hide) {
                    penalties.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true });
                } else if (!effect.hide) {
                    bonuses.push({ value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false });
                }
                if (effect.target.includes("Damage per Die")) {
                    effectBonus += parseInt(effect.value) * dicenum;
                    bonusExplain += "\n" + effect.source + ": Bonus damage " + ((parseInt(effect.value) * dicenum) >= 0 ? "+" : "") + (parseInt(effect.value) * dicenum);
                } else {
                    effectBonus += parseInt(effect.value);
                    bonusExplain += "\n" + effect.source + ": Bonus damage " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
                }
            })
        dmgBonus += effectBonus;
        //Make a nice "+#" string from the Ability bonus if there is one, or else make it empty
        let dmgBonusTotal: string = (dmgBonus) ? ((dmgBonus >= 0) && "+") + dmgBonus : "";
        //Concatenate the strings for a readable damage output
        var dmgResult = baseDice + dmgBonusTotal + " " + this.dmgType + this.get_ExtraDamage(creature, characterService, range);
        let explain = (diceExplain.trim() + "\n" + bonusExplain.trim()).trim();
        return [dmgResult, explain, bonuses, penalties, absolutes];
    }
    get_CritSpecialization(creature: Creature, characterService: CharacterService, range: string) {
        let SpecializationGains: SpecializationGain[] = [];
        let specializations: Specialization[] = [];
        let prof = this.get_Proficiency((creature as AnimalCompanion | Character), characterService);
        if (creature.type == "Character" && this.group) {
            let character = creature as Character;
            let runeSource: (Weapon | WornItem)[] = this.get_RuneSource(creature, range);
            let skillLevel = this.profLevel((creature as AnimalCompanion | Character), characterService, runeSource[1]);
            characterService.get_FeatsAndFeatures()
                .filter(feat => feat.gainSpecialization.length && feat.have(character, characterService, character.level, false))
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (spec.bladeAlly ? (this.bladeAlly || runeSource[1].bladeAlly) : true) &&
                        (spec.group ? (this.group && spec.group.includes(this.group)) : true) &&
                        (spec.range ? (range && spec.range.includes(range)) : true) &&
                        (spec.name ? ((this.name && spec.name.includes(this.name)) || (this.weaponBase && spec.name.includes(this.weaponBase))) : true) &&
                        (spec.trait ? this.traits.some(trait => spec.trait.includes(trait)) : true) &&
                        (spec.proficiency ? (prof && spec.proficiency.includes(prof)) : true) &&
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
                    if (!specializations.some(existingspec => JSON.stringify(existingspec) == JSON.stringify(spec))) {
                        specializations.push(spec);
                    }
                });
            });
        }
        return specializations;
    }
}
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { WornItem } from 'src/app/classes/WornItem';
import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Specialization } from 'src/app/classes/Specialization';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Oil } from 'src/app/classes/Oil';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { Effect } from 'src/app/classes/Effect';
import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { RefreshService } from 'src/app/services/refresh.service';
import { Item } from './Item';

type AttackResult = {
    range: string,
    attackResult: number,
    explain: string,
    effects: Effect[],
    penalties: Effect[],
    bonuses: Effect[],
    absolutes: Effect[]
}
type DamageResult = {
    damageResult: string,
    explain: string,
    penalties: Effect[],
    bonuses: Effect[],
    absolutes: Effect[]
}
type RuneSourceSet = {
    fundamentalRunes: Weapon | WornItem,
    propertyRunes: Weapon | WornItem,
    reason?: Weapon | WornItem
}
type EmblazonArmamentSet = {
    type: string,
    choice: string,
    deity: string,
    alignment: string,
    emblazonDivinity: boolean,
    source: string
}

export class Weapon extends Equipment {
    //Weapons should be type "weapons" to be found in the database
    public type = "weapons";
    //Weapons are usually moddable.
    moddable = true;
    //What type of ammo is used? (Bolts, arrows...)
    public ammunition: string = "";
    //What happens on a critical hit with this weapon?
    public criticalHint: string = ""
    //Number of dice for Damage: usually 1 for an unmodified weapon. Use 0 to notate exactly <dicesize> damage (e.g. 1 damage = 0d1).
    public dicenum: number = 1;
    //Size of the damage dice: usually 4-12.
    public dicesize: number = 6;
    //What is the damage type? Usually S, B or P, but may include combinations".
    public dmgType: string = "";
    //Some weapons add additional damage like +1d4F. Use get_ExtraDamage() to read.
    private extraDamage: string = ""
    //The weapon group, needed for critical specialization effects.
    public group: string = "";
    //How many hands are needed to wield this weapon?
    public hands: string = "";
    //Melee range in ft: 5 or 10 for weapons with Reach trait.
    public melee: number = 0;
    //Store any poisons applied to this item. There should be only one poison at a time.
    public poisonsApplied: AlchemicalPoison[] = [];
    //What proficiency is used? "Simple Weapons", "Unarmed Attacks", etc.? Use get_Proficiency() to get the proficiency for numbers and effects.
    public prof: "Unarmed Attacks" | "Simple Weapons" | "Martial Weapons" | "Advanced Weapons" = "Simple Weapons";
    //Ranged range in ft - also add for thrown weapons.
    //Weapons can have a melee and a ranged value, e.g. Daggers that can thrown.
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
    //A CLeric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
    // Subsequent feats can change options and restrictions of the functionality.
    public emblazonArmament: EmblazonArmamentSet[] = [];
    public _emblazonArmament: boolean = false;
    public _emblazonEnergy: boolean = false;
    public _emblazonAntimagic: boolean = false;
    //Dexterity-based melee attacks force you to use dexterity for your attack modifier.
    public dexterityBased: boolean = false;
    //If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency.
    public useHighestAttackProficiency: boolean = false;
    public _traits: string[] = [];
    //Shoddy weapons take a -2 penalty to attacks.
    public _shoddy: number = 0;
    recast(typeService: TypeService, itemsService: ItemsService): Weapon {
        super.recast(typeService, itemsService);
        this.poisonsApplied = this.poisonsApplied.map(obj => Object.assign<AlchemicalPoison, Item>(new AlchemicalPoison(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.material = this.material.map(obj => Object.assign(new WeaponMaterial(), obj).recast());
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign<WeaponRune, Item>(new WeaponRune(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        return this;
    }
    get_Name(): string {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let words: string[] = [];
            let potency = this.get_Potency(this.get_PotencyRune());
            if (potency) {
                words.push(potency);
            }
            let secondary: string = "";
            secondary = this.get_Striking(this.get_StrikingRune());
            if (secondary) {
                words.push(secondary);
            }
            this.propertyRunes.forEach(rune => {
                let name: string = rune.name;
                if (rune.name.includes("(Greater)")) {
                    name = "Greater " + rune.name.substr(0, rune.name.indexOf("(Greater)"));
                } else if (rune.name.includes(", Greater)")) {
                    name = "Greater " + rune.name.substr(0, rune.name.indexOf(", Greater)")) + ")";
                }
                words.push(name);
            })
            if (this.bladeAlly) {
                this.bladeAllyRunes.forEach(rune => {
                    let name: string = rune.name;
                    if (rune.name.includes("(Greater)")) {
                        name = "Greater " + rune.name.substr(0, rune.name.indexOf("(Greater)"));
                    } else if (rune.name.includes(", Greater)")) {
                        name = "Greater " + rune.name.substr(0, rune.name.indexOf(", Greater)")) + ")";
                    }
                    words.push(name);
                })
            }
            this.material.forEach(mat => {
                words.push(mat.get_Name());
            })
            //If you have any material in the name of the item, and it has a material applied, remove the original material. This list may grow.
            let materials = [
                "Wooden ",
                "Steel "
            ]
            if (this.material.length && materials.some(mat => this.name.toLowerCase().includes(mat.toLowerCase()))) {
                let name = this.name;
                materials.forEach(mat => {
                    name = name.replace(mat, "");
                })
                words.push(name);
            } else {
                words.push(this.name)
            }
            return words.join(" ");
        }
    }
    get_Price(itemsService: ItemsService): number {
        let price = this.price;
        if (this.potencyRune) {
            price += itemsService.get_CleanItems().weaponrunes.find(rune => rune.potency == this.potencyRune).price;
        }
        if (this.strikingRune) {
            price += itemsService.get_CleanItems().weaponrunes.find(rune => rune.striking == this.strikingRune).price;
        }
        this.propertyRunes.forEach(rune => {
            let cleanRune = itemsService.get_CleanItems().weaponrunes.find(weaponRune => weaponRune.name.toLowerCase() == rune.name.toLowerCase());
            if (cleanRune) {
                if (cleanRune.name == "Speed" && this.material?.[0]?.name.includes("Orichalcum")) {
                    price += Math.floor(cleanRune.price / 2);
                } else {
                    price += cleanRune.price;
                }
            }
        })
        this.material.forEach(mat => {
            price += mat.price;
            if (parseInt(this.bulk)) {
                price += (mat.bulkPrice * parseInt(this.bulk));
            }
        })
        this.talismans.forEach(talisman => {
            price += itemsService.get_CleanItems().talismans.find(cleanTalisman => cleanTalisman.name.toLowerCase() == talisman.name.toLowerCase()).price;
        })
        return price;
    }
    update_Modifiers(creature: Creature, services: { characterService: CharacterService, refreshService: RefreshService }): void {
        //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
        //Set components to update if these values have changed from before.
        const oldValues = [this._shoddy, this._emblazonArmament, this._emblazonEnergy, this._emblazonAntimagic];
        this.get_Shoddy((creature as AnimalCompanion | Character), services.characterService);
        this.get_EmblazonArmament((creature as AnimalCompanion | Character), services.characterService);
        const newValues = [this._shoddy, this._emblazonArmament, this._emblazonEnergy, this._emblazonAntimagic];
        if (oldValues.some((previous, index) => previous != newValues[index])) {
            services.refreshService.set_ToChange(creature.type, this.id);
            services.refreshService.set_ToChange(creature.type, "attacks");
            services.refreshService.set_ToChange(creature.type, "inventory");
        }
    }
    get_Shoddy(creature: Creature, characterService: CharacterService): number {
        //Shoddy items have a -2 penalty to Attack, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.get_Feats("Junk Tinker")[0]?.have(creature, characterService) && this.crafted) {
            this._shoddy = 0;
            return 0;
        } else if (this.shoddy) {
            this._shoddy = -2;
            return -2;
        } else {
            this._shoddy = 0;
            return 0;
        }
    }
    get_RuneSource(creature: Creature, range: string): RuneSourceSet {
        //Under certain circumstances, other items' runes are applied when calculating attack bonus or damage.
        //Fundamental runes and property runes can come from different items, and the item that causes this change will be noted as the reason.
        let runeSource: RuneSourceSet = { fundamentalRunes: this, propertyRunes: this };
        //For unarmed attacks, return Handwraps of Mighty Blows if invested.
        if (this.prof == "Unarmed Attacks") {
            let handwraps = creature.inventories[0].wornitems.find(item => item.isHandwrapsOfMightyBlows && item.investedOrEquipped())
            if (handwraps) {
                runeSource = { fundamentalRunes: handwraps, propertyRunes: handwraps, reason: handwraps };
            }
        }
        //Apply doubling rings to return a different item's runes if needed.
        if (range == "melee") {
            let doublingRings = creature.inventories[0].wornitems.find(item => item.isDoublingRings && item.data[1].value == this.id && item.investedOrEquipped());
            if (doublingRings) {
                if (doublingRings.data[0].value) {
                    let goldItem = creature.inventories[0].weapons.find(weapon => weapon.id == doublingRings.data[0].value);
                    if (goldItem?.investedOrEquipped()) {
                        if (doublingRings.isDoublingRings == "Doubling Rings (Greater)" && doublingRings.data[2]) {
                            runeSource = { fundamentalRunes: goldItem, propertyRunes: goldItem, reason: doublingRings };
                        } else {
                            runeSource = { fundamentalRunes: goldItem, propertyRunes: this, reason: doublingRings };
                        }
                    }
                }
            }
        }
        return runeSource;
    }
    get_EmblazonArmament(creature: Creature, characterService: CharacterService) {
        this._emblazonArmament = false;
        this._emblazonEnergy = false;
        this.emblazonArmament.forEach(ea => {
            if (ea.emblazonDivinity || (creature instanceof Character && characterService.get_CharacterDeities(creature).some(deity => deity.name.toLowerCase() == ea.deity.toLowerCase()))) {
                switch (ea.type) {
                    case "emblazonArmament":
                        this._emblazonArmament = true;
                        break;
                    case "emblazonEnergy":
                        this._emblazonEnergy = true;
                        break;
                    case "emblazonAntimagic":
                        this._emblazonAntimagic = true;
                        break;
                }
            }
        })
        return this._emblazonArmament || this._emblazonEnergy || this._emblazonAntimagic;
    }

    get_Traits(characterService: CharacterService, creature: Creature) {
        //Test for certain feats that give traits to unarmed attacks.
        let traits: string[] = JSON.parse(JSON.stringify(this.traits));
        if (this.melee) {
            //Find and apply effects that give this weapon reach.
            let effectsService = characterService.effectsService;
            let reach = 5;
            let reachTrait = traits.find(trait => trait.includes("Reach"));
            if (reachTrait) {
                reach = reachTrait.includes(" ") ? parseInt(reachTrait.split(" ")[1]) : 10;
            }
            let newReach = reach;
            let list = [
                "Reach",
                this.name + " Reach",
                this.weaponBase + " Reach",
                //"Unarmed Attacks Reach", "Simple Weapon Reach"
                this.prof + " Reach"
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
        //Create names list for effects, checking both Gain Trait and Lose Trait
        let namesList = [
            this.name + " Gain Trait",
            //"Sword Gain Trait", "Club Gain Trait"
            this.group + " Gain Trait",
            //"Unarmed Attacks Gain Trait", "Simple Weapons Gain Trait"
            this.prof + " Gain Trait",
            //"Unarmed Gain Trait", "Simple Gain Trait"
            this.prof.split(" ")[0] + " Gain Trait",
            //"Weapons Gain Trait", also "Attacks Gain Trait", but that's unlikely to be needed
            this.prof.split(" ")[1] + " Gain Trait",
        ];
        if (this.melee) {
            namesList.push(...[
                "Melee Gain Trait",
                "Melee " + this.prof.split(" ")[1] + " Gain Trait"
            ])
        }
        if (this.ranged) {
            namesList.push(...[
                "Ranged Gain Trait",
                "Ranged " + this.prof.split(" ")[1] + " Gain Trait"
            ])
        }
        namesList.push(...namesList.map(name => name.replace("Gain Trait", "Lose Trait")));
        characterService.effectsService.get_ToggledOnThese(creature, namesList).filter(effect => effect.title).forEach(effect => {
            if (effect.target.toLowerCase().includes("gain trait")) {
                traits.push(effect.title);
            } else if (effect.target.toLowerCase().includes("lose trait")) {
                traits = traits.filter(trait => trait != effect.title);
            }
        })
        traits = traits.filter(trait => !this.material.some(material => material.removeTraits.includes(trait)));
        traits = Array.from(new Set(traits)).sort();
        if (JSON.stringify(this._traits) != JSON.stringify(traits)) {
            //If any traits have changed, we need to update elements that these traits show on. First we save the traits, so we don't start a loop if anything wants to update attacks again.
            let changed: string[] = this._traits.filter(trait => !traits.includes(trait)).concat(traits.filter(trait => !this._traits.includes(trait)));
            this._traits = traits;
            changed.forEach(trait => {
                characterService.traitsService.get_Traits(trait).forEach(trait => {
                    characterService.refreshService.set_HintsToChange(creature, trait.hints, { characterService: characterService })
                })
            })
            characterService.refreshService.process_ToChange();
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
            characterService.get_CharacterFeatsAndFeatures()
                .filter(feat => feat.changeProficiency.length && feat.have(character, characterService, charLevel))
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
        const prof = this.get_Proficiency(creature, characterService, charLevel);
        //There are a lot of ways to be trained with a weapon.
        //To determine the skill level, we have to find skills for the item's proficiency, its name, its weapon base and any of its traits.
        let levels: number[] = [];
        //If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency.
        if (this.useHighestAttackProficiency) {
            const highestProficiencySkill = characterService.get_Skills(creature, "Highest Attack Proficiency", { type: "Specific Weapon Proficiency" });
            levels.push((characterService.get_Skills(creature, this.name)[0] || highestProficiencySkill[0]).level(creature, characterService, charLevel) || 0);
        }
        //Weapon name, e.g. Demon Sword.
        levels.push(characterService.get_Skills(creature, this.name, { type: "Specific Weapon Proficiency" })[0].level(creature, characterService, charLevel) || 0);
        //Weapon base, e.g. Longsword.
        levels.push(this.weaponBase ? characterService.get_Skills(creature, this.weaponBase, { type: "Specific Weapon Proficiency" })[0].level(creature, characterService, charLevel) : 0);
        //Proficiency and Group, e.g. Martial Sword.
        //There are proficiencies for "Simple Sword" or "Advanced Bow" that we need to consider, so we build that phrase here.
        let profAndGroup = prof.split(" ")[0] + " " + this.group;
        levels.push(characterService.get_Skills(creature, profAndGroup, { type: "Specific Weapon Proficiency" })[0].level(creature, characterService, charLevel) || 0);
        //Proficiency, e.g. Martial Weapons.
        levels.push(characterService.get_Skills(creature, prof)[0]?.level(creature, characterService, charLevel) || 0);
        //Any traits, e.g. Monk. Will include, for instance, "Thrown 20 ft", so we also test the first word of any multi-word trait.
        levels.push(...this.traits.map(trait => characterService.get_Skills(creature, trait, { type: "Specific Weapon Proficiency" })[0].level(creature, characterService, charLevel) || 0))
        levels.push(...this.traits.filter(trait => trait.includes(" ")).map(trait => characterService.get_Skills(creature, trait.split(" ")[0], { type: "Specific Weapon Proficiency" })[0].level(creature, characterService, charLevel) || 0))
        //Favored Weapon.
        levels.push(this.get_IsFavoredWeapon(creature, characterService) ? characterService.get_Skills(creature, "Favored Weapon", { type: "Favored Weapon" })[0].level(creature, characterService, charLevel) : 0);
        //Get the skill level by applying the result with the most increases, but no higher than 8.
        skillLevel = Math.min(Math.max(...levels.filter(level => level != undefined)), 8);
        //If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level, up to the highest proficiency you have.
        let bestSkillLevel: number = skillLevel;
        if (runeSource.propertyRunes.some(rune => rune.name == "Ancestral Echoing")) {
            //First, we get all the weapon proficiencies...
            let skills: number[] = characterService.get_Skills(creature, "", {type: "Weapon Proficiency"}).map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", { type: "Specific Weapon Proficiency" }).map(skill => skill.level(creature, characterService, charLevel)));
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        //If you have an oil applied that emulates an Ancestral Echoing rune, apply the same rule (there is no such oil, but things can change)
        if (this.oilsApplied.some(oil => oil.runeEffect && oil.runeEffect.name == "Ancestral Echoing")) {
            //First, we get all the weapon proficiencies...
            let skills: number[] = characterService.get_Skills(creature, "", { type: "Weapon Proficiency" }).map(skill => skill.level(creature, characterService, charLevel));
            skills.push(...characterService.get_Skills(creature, "", { type: "Specific Weapon Proficiency" }).map(skill => skill.level(creature, characterService, charLevel)));
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + 2, Math.max(...skills));
        }
        return bestSkillLevel;
    }
    attack(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string): AttackResult {
        //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let explain: string = "";
        const charLevel = characterService.get_Character().level;
        const str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        const dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        const runeSource = this.get_RuneSource(creature, range);
        const traits = this.get_Traits(characterService, creature);
        const skillLevel = this.profLevel(creature, characterService, runeSource.propertyRunes);
        if (skillLevel) {
            explain += "\nProficiency: " + skillLevel;
        }
        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        const charLevelBonus = ((skillLevel > 0) ? charLevel : 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: +" + charLevelBonus;
        }
        let penalties: Effect[] = [];
        let bonuses: Effect[] = [];
        let absolutes: Effect[] = [];
        //Calculate dexterity and strength penalties for the decision on which to use. They are not immediately applied.
        //The Clumsy condition affects all Dexterity attacks.
        const dexEffects = effectsService.get_RelativesOnThese(creature, ["Dexterity-based Checks and DCs", "Dexterity-based Attack Rolls"]);
        let dexPenalty: Effect[] = [];
        let dexPenaltySum: number = 0;
        dexEffects.forEach(effect => {
            dexPenalty.push(Object.assign(new Effect(), { value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true }));
            dexPenaltySum += parseInt(effect.value);
        });
        //The Enfeebled condition affects all Strength attacks
        const strEffects = effectsService.get_RelativesOnThese(creature, ["Strength-based Checks and DCs", "Strength-based Attack Rolls"]);
        let strPenalty: Effect[] = [];
        let strPenaltySum: number = 0;
        strEffects.forEach(effect => {
            strPenalty.push(Object.assign(new Effect(), { value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true }));
            strPenaltySum += parseInt(effect.value);
        });
        let dexUsed: boolean = false;
        let strUsed: boolean = false;
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let abilityMod: number = 0;
        function sign(number: number): string {
            return (number > 0 ? "+" : "") + number;
        }
        if (range == "ranged") {
            if (traits.includes("Brutal")) {
                abilityMod = str;
                explain += "\nStrength Modifier (Brutal): " + sign(abilityMod);
                strUsed = true;

            } else {
                abilityMod = dex;
                explain += "\nDexterity Modifier: " + sign(abilityMod);
                dexUsed = true;
            }
        } else {
            if (traits.includes("Finesse") && dex + dexPenaltySum > str + strPenaltySum) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Finesse): " + sign(abilityMod);
                dexUsed = true;
            } else if (this.dexterityBased) {
                abilityMod = dex;
                explain += "\nDexterity Modifier (Dexterity-based): " + sign(abilityMod);
                dexUsed = true;
            } else {
                abilityMod = str;
                explain += "\nStrength Modifier: " + sign(abilityMod);
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
        const prof = this.get_Proficiency(creature, characterService, charLevel);
        //Create names list for effects
        let namesList = [
            this.name,
            "Attack Rolls",
            this.name + " Attack Rolls",
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
            abilityName + "-based Checks and DCs",
            //"Strength-based Checks and DCs"
            abilityName + "-based Attack Rolls"
        ];
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
        //For any activated traits of this weapon, check if any effects on Attack apply. These need to be evaluated in the Trait class.
        let traitEffects: Effect[] = [];
        this.get_ActivatedTraits().forEach(activation => {
            const realTrait = characterService.traitsService.get_Traits(activation.trait)[0];
            traitEffects.push(...realTrait.get_ObjectEffects(activation, ["Attack"]));
        })
        //Add absolute effects
        effectsService.get_TypeFilteredEffects(
            traitEffects.filter(effect => effect.setValue)
                .concat(effectsService.get_AbsolutesOnThese(creature, namesList)
                ), { absolutes: true })
            .forEach(effect => {
                if (effect.show) {
                    absolutes.push(Object.assign(new Effect(), { value: 0, setValue: effect.setValue, source: effect.source, penalty: false, type: effect.type }));
                }
                attackResult = parseInt(effect.setValue)
                explain = effect.source + ": " + effect.setValue;
            });
        let effectsSum: number = 0;
        //Add relative effects, including potency bonus and shoddy penalty
        //Generate potency bonus
        const potencyRune: number = runeSource.fundamentalRunes.get_PotencyRune();
        let calculatedEffects: Effect[] = []
        if (potencyRune) {
            let source = "Potency"
            //If you're getting the potency because of another item (like Doubling Rings), name it here
            if (runeSource.reason) {
                source = "Potency (" + runeSource.reason.get_Name() + ")";
            }
            calculatedEffects.push(Object.assign(new Effect(potencyRune.toString()), { creature: creature.type, type: "item", target: this.name, source: source, apply: true, show: false }));
        }
        if (runeSource.fundamentalRunes.battleforged) {
            let source = "Battleforged";
            //If you're getting the battleforged bonus because of another item (like Handwraps of Mighty Blows), name it here
            if (runeSource.reason) {
                source = "Battleforged (" + runeSource.reason.get_Name() + ")";
            }
            calculatedEffects.push(Object.assign(new Effect("+1"), { creature: creature.type, type: "item", target: this.name, source: source, apply: true, show: false }));
        }
        //Powerful Fist ignores the nonlethal penalty on unarmed attacks.
        let hasPowerfulFist = false;
        if (this.prof == "Unarmed Attacks") {
            let character = characterService.get_Character();
            if (characterService.get_CharacterFeatsTaken(0, character.level, "Powerful Fist").length) {
                hasPowerfulFist = true;
            }
        }
        //Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
        if ((this._shoddy == 0) && this.shoddy) {
            explain += "\nShoddy (canceled by Junk Tinker): -0";
        } else if (this._shoddy) {
            calculatedEffects.push(Object.assign(new Effect("-2"), { creature: creature.type, type: "item", target: this.name, source: "Shoddy", penalty: true, apply: true, show: false }));
        }
        //Because of the Potency and Shoddy Effects, we need to filter the types a second time, even though get_RelativesOnThese comes pre-filtered.
        effectsService.get_TypeFilteredEffects(
            calculatedEffects
                .concat(traitEffects.filter(effect => effect.value != "0"))
                .concat(effectsService.get_RelativesOnThese(creature, namesList)
                ))
            .forEach(effect => {
                //Powerful Fist ignores the nonlethal penalty on unarmed attacks.
                if (hasPowerfulFist && effect.source == "conditional, Nonlethal") {
                    explain += "\nNonlethal (cancelled by Powerful Fist)";
                } else {
                    if (effect.show) {
                        if (parseInt(effect.value) < 0) {
                            penalties.push(Object.assign(new Effect(effect.value), { target: effect.target, source: effect.source, penalty: true, type: effect.type, apply: false, show: false }));
                        } else {
                            bonuses.push(Object.assign(new Effect(effect.value), { target: effect.target, source: effect.source, penalty: false, type: effect.type, apply: true, show: false }));
                        }
                    }
                    effectsSum += parseInt(effect.value);
                    explain += "\n" + effect.source + ": " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
                }
            });
        //Add up all modifiers and return the attack bonus for this attack
        attackResult += effectsSum;
        explain = explain.trim();
        return { range: range, attackResult: attackResult, explain: explain, effects: penalties.concat(bonuses).concat(absolutes), penalties: penalties, bonuses: bonuses, absolutes: absolutes };
    }
    get_ExtraDamage(creature: Creature, characterService: CharacterService, effectsService: EffectsService, range: string, prof: string, traits: string[]) {
        let extraDamage: string = "";
        if (this.extraDamage) {
            extraDamage += "\n" + this.extraDamage;
        }
        let runeSource = this.get_RuneSource(creature, range);
        runeSource.propertyRunes.propertyRunes
            .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
            .forEach((weaponRune: WeaponRune) => {
                extraDamage += "\n" + weaponRune.extraDamage;
            });
        this.oilsApplied
            .filter((oil: Oil) => oil.runeEffect && oil.runeEffect.extraDamage)
            .forEach((oil: Oil) => {
                extraDamage += "\n" + oil.runeEffect.extraDamage;
            });
        if (runeSource.propertyRunes.bladeAlly) {
            runeSource.propertyRunes.bladeAllyRunes
                .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
                .forEach((weaponRune: WeaponRune) => {
                    extraDamage += "\n" + weaponRune.extraDamage;
                });
        }
        //Emblazon Energy on a weapon adds 1d4 damage of the chosen type if the deity matches.
        if (creature instanceof Character) {
            if (this._emblazonEnergy) {
                this.emblazonArmament.filter(ea => ea.type == 'emblazonEnergy').forEach(ea => {
                    let eaDmg = "+1d4 ";
                    let type = ea.choice;
                    creature.class.spellCasting.find(casting => casting.source == "Domain Spells")?.spellChoices.forEach(choice => {
                        choice.spells.forEach(spell => {
                            if (characterService.spellsService.get_Spells(spell.name)[0]?.traits.includes(type)) {
                                eaDmg = "+1d6 ";
                            }
                        })
                    })
                    extraDamage += "\n" + eaDmg + type;
                })
            }
        }
        //Add any damage from effects. These effects must be toggle and have the damage as a string in their title.
        let namesList = [
            "Extra Damage",
            this.name + " Extra Damage",
            //"Longsword Extra Damage", "Fist Extra Damage" etc.
            this.weaponBase + " Extra Damage",
            //"Sword Extra Damage", "Club Extra Damage"
            this.group + " Extra Damage",
            //"Unarmed Attacks Extra Damage", "Simple Weapons Extra Damage" etc.
            prof + " Extra Damage",
            //"Unarmed Extra Damage", "Simple Extra Damage" etc.
            prof.split(" ")[0] + " Extra Damage",
            //"Weapons Extra Damage", also "Attacks Extra Damage", but that's unlikely to be needed
            prof.split(" ")[1] + " Extra Damage",
            //"Simple Sword Extra Damage", "Martial Club Extra Damage" etc.
            prof.split(" ")[0] + this.group + " Extra Damage",
            //"Simple Longsword Extra Damage", "Unarmed Fist Extra Damage" etc.
            prof.split(" ")[0] + this.weaponBase + " Extra Damage"
        ]
        if (traits.includes("Agile")) {
            //"Agile Large Melee Extra Damage"
            if (this.large) {
                namesList.push("Agile Large " + range + " Weapon Extra Damage");
            }
            //"Agile Melee Extra Damage"
            namesList.push("Agile " + range + " Extra Damage");
            if ((range == "ranged") && this.traits.some(trait => trait.includes("Thrown"))) {
                //"Agile Thrown Large Weapon Extra Damage"
                if (this.large) {
                    namesList.push("Agile Thrown Large Weapon Extra Damage")
                }
                //"Agile Thrown Weapon Extra Damage"
                namesList.push("Agile Thrown Weapon Extra Damage");
            }
        } else {
            //"Non-Agile Large Melee Weapon Extra Damage"
            if (this.large) {
                namesList.push("Non-Agile Large " + range + " Weapon Extra Damage");
            }
            //"Non-Agile Melee Extra Damage"
            namesList.push("Non-Agile " + range + " Extra Damage");
            if ((range == "ranged") && this.traits.some(trait => trait.includes("Thrown"))) {
                //"Non-Agile Thrown Large Weapon Extra Damage"
                if (this.large) {
                    namesList.push("Non-Agile Thrown Large Weapon Extra Damage")
                }
                //"Non-Agile Thrown Weapon Extra Damage"
                namesList.push("Non-Agile Thrown Weapon Extra Damage");
            }
        }
        effectsService.get_ToggledOnThese(creature, namesList).filter(effect => effect.title).forEach(effect => {
            extraDamage += "\n" + (!["+", "-"].includes(effect.title.substr(0, 1)) ? "+" : "") + effect.title;
        })
        extraDamage = extraDamage.split("+").map(part => part.trim()).join(" + ");
        extraDamage = extraDamage.split("-").map(part => part.trim()).join(" - ");
        return extraDamage;
    }
    get_IsFavoredWeapon(creature: Character | AnimalCompanion, characterService: CharacterService) {
        if ((creature instanceof Character && creature.class.deity)) {
            return characterService.get_CharacterDeities(creature)[0]?.favoredWeapon.some(favoredWeapon => [this.name, this.weaponBase, this.displayName].includes(favoredWeapon));
        }
        if (
            creature instanceof Character &&
            characterService.get_CharacterFeatsTaken(0, creature.level, "Favored Weapon (Syncretism)").length
        ) {
            return characterService.get_CharacterDeities(creature, "syncretism")[0]?.favoredWeapon.some(favoredWeapon => [this.name, this.weaponBase, this.displayName].includes(favoredWeapon));
        }
        return false;
    }
    damage(creature: Character | AnimalCompanion, characterService: CharacterService, effectsService: EffectsService, range: string): DamageResult {
        //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
        //Returns a string in the form of "1d6+5 B\n+1d6 Fire"
        //A weapon with no dice and no extra damage returns a damage of "0".
        if (!this.dicenum && !this.dicesize && !this.extraDamage) {
            return { damageResult: "0", explain: "", penalties: [], bonuses: [], absolutes: [] };
        }
        let diceExplain: string = "Base dice: " + (this.dicenum ? this.dicenum + "d" : "") + this.dicesize;
        let bonusExplain: string = "";
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService).result;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        let penalties: Effect[] = [];
        let bonuses: Effect[] = [];
        let absolutes: Effect[] = [];
        const prof = this.get_Proficiency(creature, characterService);
        const traits = this._traits;
        let namesList: string[] = [];
        //Apply any mechanism that copy runes from another item, like Handwraps of Mighty Blows or Doubling Rings.
        //We set runeSource to the respective item and use it whenever runes are concerned.
        const runeSource = this.get_RuneSource(creature, range);
        //Determine the dice Number - Dice Number Multiplier first, then Dice Number (Striking included)
        let dicenum = this.dicenum;
        if (dicenum) {
            let dicenumMultiplier = 1;
            namesList = [
                "Damage Dice Number Multiplier",
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
            ]
            effectsService.get_AbsolutesOnThese(creature, namesList).forEach(effect => {
                dicenumMultiplier = parseInt(effect.setValue);
                diceExplain += "\n" + effect.source + ": Dice number multiplier " + dicenumMultiplier;
            })
            effectsService.get_RelativesOnThese(creature, namesList).forEach(effect => {
                dicenumMultiplier += parseInt(effect.value);
                diceExplain += "\n" + effect.source + ": Dice number multiplier " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
            })
            dicenum *= dicenumMultiplier;
            let calculatedEffects: Effect[] = [];
            namesList = [
                "Damage Dice Number",
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
            ]
            //Add the striking rune or oil of potency effect of the runeSource.
            //Only apply and explain Striking if it's actually better than your multiplied dice number.
            if (runeSource.fundamentalRunes.get_StrikingRune() + 1 > dicenum) {
                let source = runeSource.fundamentalRunes.get_Striking(runeSource.fundamentalRunes.get_StrikingRune());
                //If you're getting the striking effect because of another item (like Doubling Rings), name it here
                if (runeSource.reason) {
                    source += " (" + runeSource.reason.get_Name() + ")";
                }
                calculatedEffects.push(Object.assign(new Effect(), { creature: creature.type, type: "untyped", target: this.name + " Dice Number", setValue: (1 + runeSource.fundamentalRunes.get_StrikingRune()).toString(), source: source, apply: true, show: false }));
            }
            //For any activated traits of this weapon, check if any effects on Dice Number apply. These need to be calculated in the effects service.
            let traitEffects = [];
            this.get_ActivatedTraits().forEach(activation => {
                const realTrait = characterService.traitsService.get_Traits(activation.trait)[0];
                traitEffects.push(...realTrait.get_ObjectEffects(activation, ["Dice Number"]));
            })
            effectsService.get_TypeFilteredEffects(
                calculatedEffects
                    .concat(traitEffects.filter(effect => effect.setValue))
                    .concat(effectsService.get_AbsolutesOnThese(creature, namesList)
                    ), { absolutes: true })
                .forEach(effect => {
                    dicenum = parseInt(effect.setValue);
                    diceExplain += "\n" + effect.source + ": Dice number " + dicenum;
                })
            calculatedEffects = [];
            //Diamond Fists adds the forceful trait to your unarmed attacks, but if one already has the trait, it gains one damage die.
            if (this.prof == "Unarmed Attacks") {
                const character = characterService.get_Character();
                if (characterService.get_CharacterFeatsTaken(0, character.level, "Diamond Fists").length && this.traits.includes("Forceful")) {
                    calculatedEffects.push(Object.assign(new Effect("+1"), { creature: creature.type, type: "untyped", target: this.name + " Dice Number", source: "Diamond Fists", apply: true, show: false }));
                }
            }
            effectsService.get_TypeFilteredEffects(
                calculatedEffects
                    .concat(traitEffects.filter(effect => effect.value != "0"))
                    .concat(effectsService.get_RelativesOnThese(creature, namesList)
                    ))
                .forEach(effect => {
                    dicenum += parseInt(effect.value);
                    diceExplain += "\n" + effect.source + ": Dice number " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
                })
        }
        //Determine the dice size.
        let dicesize = this.dicesize;
        if (dicesize) {
            let calculatedEffects: Effect[] = [];
            //Champions get increased dice size via Deific Weapon for unarmed attacks with d4 damage or simple weapons as long as they are their deity's favored weapon.
            if (((dicesize == 4 && this.prof == "Unarmed Attacks") || this.prof == "Simple Weapons") &&
                characterService.get_CharacterFeatsAndFeatures("Deific Weapon")[0]?.have(creature, characterService)) {
                if (this.get_IsFavoredWeapon(creature, characterService)) {
                    let newDicesize = Math.max(Math.min(dicesize + 2, 12), 6);
                    if (newDicesize > dicesize) {
                        calculatedEffects.push(Object.assign(new Effect(), { creature: creature.type, type: "untyped", target: this.name + " Dice Size", setValue: newDicesize.toString(), source: "Deific Weapon", apply: true, show: false }));
                    }
                }
            }
            //Clerics get increased dice size via Deadly Simplicity for unarmed attacks with less than d6 damage or simple weapons as long as they are their deity's favored weapon.
            if (((dicesize < 6 && this.prof == "Unarmed Attacks") || this.prof == "Simple Weapons") &&
                characterService.get_Feats("Deadly Simplicity")[0]?.have(creature, characterService)) {
                if (this.get_IsFavoredWeapon(creature, characterService)) {
                    let newDicesize = Math.max(Math.min(dicesize + 2, 12), 6);
                    if ((dicesize < 6 && this.prof == "Unarmed Attacks")) {
                        newDicesize = 6;
                    }
                    if (newDicesize > dicesize) {
                        calculatedEffects.push(Object.assign(new Effect(), { creature: creature.type, type: "untyped", target: this.name + " Dice Size", setValue: newDicesize.toString(), source: "Deadly Simplicity", apply: true, show: false }));
                    }
                }
            }
            //Weapons with the Two-Hand trait get to change their dice size if they are wielded with two hands.
            if (this.twohanded) {
                traits.filter(trait => trait.includes("Two-Hand")).forEach(trait => {
                    const twoHandedDiceSize = parseInt(trait.substr(10))
                    if (twoHandedDiceSize) {
                        if (twoHandedDiceSize > dicesize) {
                            calculatedEffects.push(Object.assign(new Effect(), { creature: creature.type, type: "untyped", target: this.name + " Dice Size", setValue: twoHandedDiceSize.toString(), source: "Two-Hand", apply: true, show: false }));
                        }
                    }
                })
            }
            //For any activated traits of this weapon, check if any effects on Dice Size apply. These need to be calculated in the effects service.
            let traitEffects = [];
            this.get_ActivatedTraits().forEach(activation => {
                const realTrait = characterService.traitsService.get_Traits(activation.trait)[0];
                traitEffects.push(...realTrait.get_ObjectEffects(activation, ["Dice Size"]));
            })
            //Apply dice size effects.
            namesList = [
                "Dice Size",
                "Damage Dice Size",
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
            ]
            effectsService.get_TypeFilteredEffects(
                calculatedEffects
                    .concat(traitEffects.filter(effect => effect.setValue))
                    .concat(effectsService.get_AbsolutesOnThese(creature, namesList)
                    ), { absolutes: true })
                .forEach(effect => {
                    dicesize = parseInt(effect.setValue);
                    diceExplain += "\n" + effect.source + ": Dice size d" + dicesize;
                })
            effectsService.get_TypeFilteredEffects(
                traitEffects.filter(effect => effect.value != "0")
                    .concat(effectsService.get_RelativesOnThese(creature, namesList)
                    ))
                .forEach(effect => {
                    dicesize += parseInt(effect.value);
                    //Don't raise dice size over 12.
                    dicesize = Math.min(12, dicesize);
                    diceExplain += "\n" + effect.source + ": Dice size d" + dicesize;
                })
        }
        //Get the basic "#d#" string from the weapon's dice values, unless dicenum is 0 or null (for instance some weapons deal exactly 1 base damage, which is represented by 0d1).
        // In that case, add the damage to the damage bonus and ignore the #d# string.
        let baseDice = "";
        let dmgBonus: number = 0;
        if (dicenum) {
            baseDice = dicenum + "d" + dicesize;
        } else {
            if (dicesize) {
                dmgBonus += dicesize
            }
        };
        //Decide whether this weapon uses strength or dexterity (modifier, bonuses and penalties).
        let calculatedEffects: Effect[] = [];
        let strUsed: boolean = false;
        let dexUsed: boolean = false;
        let abilityReason: string = "";
        //Weapons with the Splash trait do not add your Strength modifier (and presumably not your Dexterity modifier, either).
        if (!traits.includes("Splash")) {
            let abilityMod: number = 0;
            //First, calculate dexterity and strength penalties to see which would be more beneficial. They are not immediately applied.
            //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
            if (range == "ranged") {
                if (traits.includes("Propulsive")) {
                    if (str > 0) {
                        abilityMod = Math.floor(str / 2);
                        abilityReason = "Propulsive";
                        strUsed = true;
                    } else if (str < 0) {
                        abilityMod = str;
                        abilityReason = "Propulsive";
                        strUsed = true;
                    }
                } else if (traits.some(trait => trait.includes("Thrown"))) {
                    abilityMod = str;
                    abilityReason += "Thrown";
                    strUsed = true;
                }
            } else {
                //If the weapon is Finesse and you have the Thief Racket, you apply your Dexterity modifier to damage if it is higher.
                if (traits.includes("Finesse") &&
                    creature.type == "Character" &&
                    characterService.get_CharacterFeatsTaken(1, creature.level, "Thief Racket").length) {
                    //Check if dex or str would give you more damage by comparing your modifiers and any penalties and bonuses.
                    //The Enfeebled condition affects all Strength damage
                    const strEffects = effectsService.get_RelativesOnThis(creature, "Strength-based Checks and DCs");
                    let strPenaltySum: number = 0;
                    strEffects.forEach(effect => {
                        strPenaltySum += parseInt(effect.value);
                    });
                    //The Clumsy condition affects all Dexterity damage
                    const dexEffects = effectsService.get_RelativesOnThis(creature, "Dexterity-based Checks and DCs");
                    let dexPenaltySum: number = 0;
                    dexEffects.forEach(effect => {
                        dexPenaltySum += parseInt(effect.value);
                    });
                    if ((dex + dexPenaltySum) > (str + strPenaltySum)) {
                        abilityMod = dex;
                        abilityReason += "Thief";
                        dexUsed = true;
                    } else {
                        abilityMod = str;
                        strUsed = true;
                    }
                } else {
                    abilityMod = str;
                    strUsed = true;
                }
            }
            if (abilityMod) {
                let abilitySource: string = ""
                if (strUsed) {
                    abilitySource = "Strength Modifier";
                }
                if (dexUsed) {
                    abilitySource = "Dexterity Modifier";
                }
                if (abilityReason) {
                    abilitySource += " (" + abilityReason + ")"
                }
                calculatedEffects.push(Object.assign(new Effect(abilityMod.toString()), { creature: creature.type, type: "untyped", target: this.name + " Damage", source: abilitySource, apply: true, show: false }));
            }
        }
        //Mature and Specialized Companions add extra Damage to their attacks.
        if (creature instanceof AnimalCompanion) {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDamage) {
                    let companionSource: string = "";
                    let companionMod: number = level.extraDamage;
                    companionSource = level.name + " Animal Companion";
                    if (creature.class.specializations.length) {
                        companionMod *= 2;
                        companionSource = "Specialized Animal Companion";
                    }
                    calculatedEffects.push(Object.assign(new Effect(companionMod.toString()), { creature: creature.type, type: "untyped", target: this.name + " Damage", source: companionSource, apply: true, show: false }));
                }
            })
        }
        //Emblazon Armament on a weapon adds a +1 status bonus to damage rolls if the deity matches.
        if (creature instanceof Character) {
            if (this._emblazonArmament) {
                this.emblazonArmament.filter(ea => ea.type == 'emblazonArmament').forEach(ea => {
                    calculatedEffects.push(Object.assign(new Effect("+1"), { creature: creature.type, type: "status", target: this.name + " Damage", source: "Emblazon Armament", apply: true, show: false }));
                })
            }
        }
        const profLevel = this.profLevel(creature, characterService, runeSource.propertyRunes);
        let list = [
            "Damage Rolls",
            this.name + " Damage",
            this.name + " Damage Rolls",
            //"Longsword Damage", "Fist Melee Damage"
            this.weaponBase + " Damage",
            //"Melee Damage", "Ranged Damage"
            range + " Damage"
        ];
        //Add any traits, i.e. "Monk Damage", "Gnome Damage", but don't include any added ranges.
        traits.forEach(trait => {
            if (trait.includes(" ft")) {
                list.push(trait.split(" ")[0] + " Damage");
            } else {
                list.push(trait + " Damage");
            }
        })
        if (traits.includes("Agile")) {
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
                if (effect.show) {
                    absolutes.push(Object.assign(new Effect(), { value: 0, setValue: effect.setValue, source: effect.source, penalty: false }));
                }
                dmgBonus = parseInt(effect.setValue);
                bonusExplain = "\n" + effect.source + ": Bonus damage " + parseInt(effect.setValue);
            })
        if (!effectsService.get_EffectsOnThis(creature, "Ignore Bonus Damage on " + this.name).length) {
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
            //Proficiency-based damage
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
            //Pre-create Effects based on "Damage per Die" effects.
            //For any activated traits of this weapon, check if any effects on Dice Size apply. These need to be calculated in the effects service.
            let traitEffects = [];
            this.get_ActivatedTraits().forEach(activation => {
                let realTrait = characterService.traitsService.get_Traits(activation.trait)[0];
                traitEffects.push(...realTrait.get_ObjectEffects(activation, ["Damage per Die"]));
            })
            let perDieList: string[] = [];
            if (this.prof == "Unarmed Attacks") {
                perDieList.push("Unarmed Damage per Die");
            } else {
                perDieList.push("Weapon Damage per Die");
            }
            traits.forEach(trait => {
                if (trait.includes(" ft")) {
                    perDieList.push(trait.split(" ")[0] + " Damage per Die");
                } else {
                    perDieList.push(trait + " Damage per Die");
                }
            })
            //All "...Damage per Die" effects are converted to just "...Damage" (by multiplying with the dice number) and then re-processed with the rest of the damage effects.
            traitEffects.filter(effect => effect.value != "0")
                .concat(effectsService.get_RelativesOnThese(creature, perDieList))
                .forEach(effect => {
                    const effectBonus = parseInt(effect.value) * dicenum;
                    let newEffect = Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(effect))).recast();
                    newEffect.target = newEffect.target.replace(" per Die", "");
                    newEffect.value = effectBonus.toString();
                    calculatedEffects.push(newEffect);
                })
            //Now collect and apply the type-filtered effects on this weapon's damage, including the pregenerated ones.
            effectsService.get_TypeFilteredEffects(
                calculatedEffects
                    .concat(effectsService.get_RelativesOnThese(creature, list)
                    ))
                .forEach(effect => {
                    if (effect.show) {
                        if (parseInt(effect.value) < 0) {
                            penalties.push(Object.assign(new Effect(), { value: parseInt(effect.value), setValue: "", source: effect.source, penalty: true }));
                        } else {
                            bonuses.push(Object.assign(new Effect(), { value: parseInt(effect.value), setValue: "", source: effect.source, penalty: false }));
                        }
                    }
                    effectBonus += parseInt(effect.value);
                    bonusExplain += "\n" + effect.source + ": Damage " + (parseInt(effect.value) >= 0 ? "+" : "") + parseInt(effect.value);
                })
            dmgBonus += effectBonus;
        };
        //Concatenate the strings for a readable damage output
        let dmgResult = baseDice;
        if (dmgBonus > 0) {
            if (baseDice) {
                dmgResult += " + "
            }
            dmgResult += dmgBonus;
        } else if (dmgBonus < 0) {
            if (baseDice) {
                dmgResult += " - "
            }
            dmgResult += (dmgBonus * -1);
        }
        let dmgType = this.dmgType;
        if (dmgType) {
            //If any versatile traits have been added to the weapon's original traits, also add the additional damage type to its damage type.
            traits.filter(trait => trait.toLowerCase().includes("versatile") && !this.traits.includes(trait)).forEach(trait => {
                let type = trait.split(" ")[1];
                if (type) {
                    dmgType += "/" + type;
                }
            })
            dmgResult += " " + dmgType;
        }
        dmgResult += " " + this.get_ExtraDamage(creature, characterService, effectsService, range, prof, traits);
        let explain = (diceExplain.trim() + "\n" + bonusExplain.trim()).trim();
        return { damageResult: dmgResult, explain: explain, penalties: penalties, bonuses: bonuses, absolutes: absolutes };
    }
    get_CritSpecialization(creature: Creature, characterService: CharacterService, range: string): Specialization[] {
        let SpecializationGains: SpecializationGain[] = [];
        let specializations: Specialization[] = [];
        const prof = this.get_Proficiency((creature as AnimalCompanion | Character), characterService);
        if (creature instanceof Character && this.group) {
            const character = creature as Character;
            const runeSource = this.get_RuneSource(creature, range);
            const skillLevel = this.profLevel(creature, characterService, runeSource.propertyRunes);
            characterService.get_CharacterFeatsAndFeatures()
                .filter(feat => feat.gainSpecialization.length && feat.have(character, characterService, character.level))
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (spec.minLevel ? creature.level >= spec.minLevel : true) &&
                        (spec.bladeAlly ? (this.bladeAlly || runeSource.propertyRunes.bladeAlly) : true) &&
                        (spec.favoredWeapon ? this.get_IsFavoredWeapon(creature, characterService) : true) &&
                        (spec.group ? (this.group && spec.group.includes(this.group)) : true) &&
                        (spec.range ? (range && spec.range.includes(range)) : true) &&
                        (spec.name ? ((this.name && spec.name.includes(this.name)) || (this.weaponBase && spec.name.includes(this.weaponBase))) : true) &&
                        (spec.trait ? this.traits.some(trait => spec.trait.includes(trait)) : true) &&
                        (spec.proficiency ? (prof && spec.proficiency.includes(prof)) : true) &&
                        (spec.skillLevel ? skillLevel >= spec.skillLevel : true) &&
                        (spec.featreq ? characterService.get_CharacterFeatsAndFeatures(spec.featreq)[0]?.have(character, characterService) : true)
                    ))
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Specialization[] = characterService.get_Specializations(this.group).map(spec => Object.assign(new Specialization(), spec).recast());
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
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Equipment } from './Equipment';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';
import { SpecializationGain } from './SpecializationGain';
import { Specialization } from './Specialization';

export class Armor extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Armor should be type "armors" to be found in the database
    readonly type = "armors";
    //For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead
    //This value influences acbonus, skillpenalty, dexcap and strength
    public $affectedByArmoredSkirt: -1|0|1 = 0;
    //The armor's inherent bonus to AC
    private acbonus: number = 0;
    //What kind of armor is this based on? Needed for armor proficiencies for specific magical items.
    public armorBase: string = ""
    //The highest dex bonus to AC you can get while wearing this armor.
    //-1 is unlimited.
    public dexcap: number = -1;
    //The armor group, needed for critical specialization effects
    public group: string = "";
    //Armor are usually moddable like armor. Armor that cannot be modded should be set to "-"
    moddable = "armor" as ""|"-"|"weapon"|"armor"|"shield";
    //What proficiency is used? "Light Armor", "Medium Armor"?
    private prof: string = "Light Armor";
    //The penalty to certain skills if your strength is lower than the armors requirement
    //Should be a negative number
    private skillpenalty: number = 0;
    //The penalty to all speeds if your strength is lower than the armors requirement
    //Should be a negative number and a multiple of -5
    public speedpenalty: number = 0;
    //The strength requirement (strength, not STR) to overcome skill and speed penalties
    private strength: number = 0;
    get_Bulk() {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk: string = "";
        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });
        //Fortification Runes raise the required strength
        let fortification = this.propertyRunes.filter(rune => rune.name.includes("Fortification")).length ? 1 : 0;
        if (parseInt(this.bulk)) {
            return oilBulk || (parseInt(this.bulk) + fortification).toString();
        } else {
            return oilBulk || fortification ? fortification.toString() : this.bulk;
        }
        
    }
    get_ArmoredSkirt(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService) {
        if (["Breastplate","Chain Shirt","Chain Mail","Scale Mail"].includes(this.name) ) {
            let armoredSkirt = characterService.get_Inventories(creature).map(inventory => inventory.adventuringgear).filter(gear => gear.filter(item => item.isArmoredSkirt && item.equipped).length);
            if (armoredSkirt.length) {
                this.$affectedByArmoredSkirt = 1;
                return armoredSkirt[0];
            } else {
                this.$affectedByArmoredSkirt = 0;
                return null;
            }
        } else if (["Half Plate","Full Plate","Hellknight Plate"].includes(this.name) ) {
            let armoredSkirt = characterService.get_Inventories(creature).map(inventory => inventory.adventuringgear).filter(gear => gear.filter(item => item.isArmoredSkirt && item.equipped).length);
            if (armoredSkirt.length) {
                this.$affectedByArmoredSkirt = -1;
                return armoredSkirt[0];
            } else {
                this.$affectedByArmoredSkirt = 0;
                return null;
            }
        } else {
            this.$affectedByArmoredSkirt = 0;
            return null;
        }
    }
    get_ACBonus() {
        return this.acbonus + this.$affectedByArmoredSkirt;
    }
    get_SkillPenalty() {
        return this.skillpenalty - this.$affectedByArmoredSkirt;
    }
    get_DexCap() {
        if (this.dexcap != -1) {
            return this.dexcap - this.$affectedByArmoredSkirt;
        } else {
            return this.dexcap;
        }
        
    }
    get_Strength() {
        //Fortification Runes raise the required strength
        let fortification = this.propertyRunes.filter(rune => rune.name.includes("Fortification")).length ? 2 : 0;
        return this.strength + this.$affectedByArmoredSkirt + fortification;
    }
    get_Prof() {
        if (this.$affectedByArmoredSkirt == 1) {
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
        if (this.$affectedByArmoredSkirt != 0) {
            if (this.traits.includes("Noisy")) {
                return this.traits.concat("Noisy");
            } else {
                return this.traits;
            }
        } else {
            return this.traits;
        }
    }
    profLevel(creature: Character|AnimalCompanion, characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        this.get_ArmoredSkirt(creature, characterService);
        let skillLevel: number = 0;
        let armorIncreases = creature.get_SkillIncreases(characterService, 0, charLevel, this.name);
        let profIncreases = creature.get_SkillIncreases(characterService, 0, charLevel, this.get_Prof());
        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.min(Math.max(armorIncreases.length * 2, profIncreases.length * 2), 8)
        return skillLevel;
    }
    armorBonus(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
    //Calculates the full AC bonus when wearing this armor
    //We assume that only one armor is worn at a time
        let explain: string = "AC Basis: 10";
        let charLevel = characterService.get_Character().level;
        let dex = characterService.get_Abilities("Dexterity")[0].mod(creature, characterService, effectsService).result;
        //Get the profiency with either this armor or its category
        //Familiars have the same AC as the Character.
        let skillLevel = this.profLevel(creature, characterService);
        if (skillLevel) {
            explain += "\nProficiency: "+skillLevel;
        }
        //Add character level if the character is trained or better with either the armor category or the armor itself
        let charLevelBonus = ((skillLevel > 0) ? charLevel: 0);
        if (charLevelBonus) {
            explain += "\nCharacter Level: "+charLevelBonus;
        }
        //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
        let dexBonus = (this.dexcap != -1) ? Math.min(dex, (this.get_DexCap())) : dex;
        if (dexBonus) {
            if (this.dexcap != -1 && this.get_DexCap() < dex) {
                explain += "\nDexterity Modifier (capped): "+dexBonus;
            } else {
                explain += "\nDexterity Modifier: "+dexBonus;
            }
        }
        if (this.get_PotencyRune() > 0) {
            explain += "\nPotency: "+this.get_Potency(this.get_PotencyRune());
        }
        //Add up all modifiers and return the AC gained from this armor
        //Also adding any inherent AC bonus
        let defenseResult: number = 10 + charLevelBonus + skillLevel + this.get_ACBonus() + dexBonus + this.get_PotencyRune();
        if (this.get_ACBonus()) {
            explain += "\nArmor Bonus: "+this.get_ACBonus();
        }
        let endresult: [number, string] = [defenseResult, explain]
        return endresult;
    }
    get_ArmorSpecialization(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService) {
        let SpecializationGains: SpecializationGain[] = [];
        let specializations: Specialization[] = [];
        if (creature.type == "Character" && this.group) {
            let character = creature as Character;
            let skillLevel = this.profLevel(creature, characterService);
            character.get_FeatsTaken(0, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
                .filter(feat => feat?.gainSpecialization?.length).forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (spec.group ? (this.group && spec.group.includes(this.group)) : true) &&
                        (spec.name ? ((this.name && spec.name.includes(this.name)) || (this.armorBase && spec.name.includes(this.armorBase))) : true) &&
                        (spec.trait ? this.traits.filter(trait => trait && spec.trait.includes(trait)).length : true) &&
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
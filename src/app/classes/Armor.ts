import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';
import { Equipment } from 'src/app/classes/Equipment';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { Specialization } from 'src/app/classes/Specialization';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { Creature } from 'src/app/classes/Creature';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Rune } from 'src/app/classes/Rune';

export class Armor extends Equipment {
    //Armor should be type "armors" to be found in the database
    readonly type = "armors";
    //For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead
    //This value influences acbonus, skillpenalty, dexcap and strength
    public _affectedByArmoredSkirt: -1 | 0 | 1 = 0;
    //Shoddy armors give a penalty of -2 unless you have the Junk Tinker feat.
    public _shoddy: -2 | 0 = 0;
    //The armor's inherent bonus to AC.
    private acbonus: number = 0;
    //What kind of armor is this based on? Needed for armor proficiencies for specific magical items.
    public armorBase: string = ""
    //The highest dex bonus to AC you can get while wearing this armor.
    //-1 is unlimited.
    public dexcap: number = -1;
    //The armor group, needed for critical specialization effects.
    public group: string = "";
    //Armor is usually moddable.
    moddable = true;
    //What proficiency is used? "Light Armor", "Medium Armor"?
    private prof: string = "Light Armor";
    //The penalty to certain skills if your strength is lower than the armors requirement.
    //Should be a negative number
    private skillpenalty: number = 0;
    //The penalty to all speeds if your strength is lower than the armors requirement.
    //Should be a negative number and a multiple of -5.
    public speedpenalty: number = 0;
    //The strength requirement (strength, not STR) to overcome skill and speed penalties.
    private strength: number = 0;
    //A Dwarf with the Battleforger feat can polish armor to grant the effect of a +1 potency rune.
    public battleforged: boolean = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign<ArmorRune, ArmorRune>(new ArmorRune(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.material = this.material.map(obj => Object.assign(new ArmorMaterial(), obj).recast());
        return this;
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let words: string[] = [];
            let potency = this.get_Potency(this.get_PotencyRune());
            if (potency) {
                words.push(potency);
            }
            let secondary: string = "";
            secondary = this.get_Resilient(this.get_ResilientRune());
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
    get_Price(itemsService: ItemsService) {
        let price = this.price;
        if (this.potencyRune) {
            price += itemsService.get_CleanItems().armorrunes.find(rune => rune.potency == this.potencyRune).price;
        }
        if (this.resilientRune) {
            price += itemsService.get_CleanItems().armorrunes.find(rune => rune.resilient == this.resilientRune).price;
        }
        this.propertyRunes.forEach(rune => {
            price += itemsService.get_CleanItems().armorrunes.find(armorRune => armorRune.name.toLowerCase() == rune.name.toLowerCase()).price;
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
    update_Modifiers(creature: Creature, services: { characterService: CharacterService, refreshService: RefreshService }) {
        //Initialize shoddy values and armored skirt.
        //Set components to update if these values have changed from before.
        const oldValues = [this._affectedByArmoredSkirt, this._shoddy];
        this.get_ArmoredSkirt(creature as AnimalCompanion | Character);
        this.get_Shoddy((creature as AnimalCompanion | Character), services.characterService);
        const newValues = [this._affectedByArmoredSkirt, this._shoddy];
        if (oldValues.some((previous, index) => previous != newValues[index])) {
            services.refreshService.set_ToChange(creature.type, "inventory");
        }
    }
    get_ArmoredSkirt(creature: Creature) {
        if (["Breastplate", "Chain Shirt", "Chain Mail", "Scale Mail"].includes(this.name)) {
            let armoredSkirt = creature.inventories.map(inventory => inventory.adventuringgear).find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));
            if (armoredSkirt?.length) {
                this._affectedByArmoredSkirt = 1;
                return armoredSkirt[0];
            } else {
                this._affectedByArmoredSkirt = 0;
                return null;
            }
        } else if (["Half Plate", "Full Plate", "Hellknight Plate"].includes(this.name)) {
            let armoredSkirt = creature.inventories.map(inventory => inventory.adventuringgear).find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));
            if (armoredSkirt?.length) {
                this._affectedByArmoredSkirt = -1;
                return armoredSkirt[0];
            } else {
                this._affectedByArmoredSkirt = 0;
                return null;
            }
        } else {
            this._affectedByArmoredSkirt = 0;
            return null;
        }
    }
    get_Shoddy(creature: Creature, characterService: CharacterService) {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
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
    get_ACBonus() {
        return this.acbonus + this._affectedByArmoredSkirt + this._shoddy;
    }
    get_SkillPenalty() {
        return Math.min(0, this.skillpenalty - this._affectedByArmoredSkirt + this._shoddy + this.material.map(material => (material as ArmorMaterial).skillPenaltyModifier).reduce((a, b) => a + b, 0));
    }
    get_SpeedPenalty() {
        return Math.min(0, this.speedpenalty + this.material.map(material => (material as ArmorMaterial).speedPenaltyModifier).reduce((a, b) => a + b, 0));
    }
    get_DexCap() {
        if (this.dexcap != -1) {
            return this.dexcap - this._affectedByArmoredSkirt;
        } else {
            return this.dexcap;
        }

    }
    get_Strength() {
        //Fortification Runes raise the required strength
        let fortification = this.propertyRunes.filter(rune => rune.name.includes("Fortification")).length ? 2 : 0;
        //Some materials lower the required strength
        let material = this.material.map(material => (material as ArmorMaterial).strengthScoreModifier).reduce((a, b) => a + b, 0);
        return this.strength + (this._affectedByArmoredSkirt * 2) + fortification + material;
    }
    get_Proficiency(creature: Creature = null, characterService: CharacterService = null) {
        //creature and characterService are not needed for armors, but for weapons.
        if (this._affectedByArmoredSkirt == 1) {
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
    get_Traits(characterService?: CharacterService, creature?: Creature) {
        //characterService and creature are not needed for armors, but for other types of item.
        let traits = this.traits.filter(trait => !this.material.some(material => material.removeTraits.includes(trait)));
        if (this._affectedByArmoredSkirt != 0) {
            //An armored skirt makes your armor noisy if it isn't already.
            if (!traits.includes("Noisy")) {
                traits = traits.concat("Noisy");
            }
        }
        this._traits = traits;
        return traits;
    }
    profLevel(creature: Character | AnimalCompanion, characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        this.get_ArmoredSkirt(creature);
        let skillLevel: number = 0;
        let armorIncreases = creature.get_SkillIncreases(characterService, 0, charLevel, this.name);
        let profIncreases = creature.get_SkillIncreases(characterService, 0, charLevel, this.get_Proficiency());
        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.min(Math.max(armorIncreases.length * 2, profIncreases.length * 2), 8)
        return skillLevel;
    }
    get_ArmorSpecialization(creature: Creature, characterService: CharacterService): Specialization[] {
        let SpecializationGains: SpecializationGain[] = [];
        let specializations: Specialization[] = [];
        let prof = this.get_Proficiency();
        if (creature.type == "Character" && this.group) {
            let character = creature as Character;
            let skillLevel = this.profLevel(character, characterService);
            characterService.get_CharacterFeatsAndFeatures()
                .filter(feat => feat.gainSpecialization.length && feat.have(character, characterService, character.level))
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (spec.group ? (this.group && spec.group.includes(this.group)) : true) &&
                        (spec.name ? ((this.name && spec.name.includes(this.name)) || (this.armorBase && spec.name.includes(this.armorBase))) : true) &&
                        (spec.trait ? this.traits.filter(trait => trait && spec.trait.includes(trait)).length : true) &&
                        (spec.proficiency ? (prof && spec.proficiency.includes(prof)) : true) &&
                        (spec.skillLevel ? skillLevel >= spec.skillLevel : true) &&
                        (spec.featreq ? characterService.get_CharacterFeatsAndFeatures(spec.featreq)[0]?.have(character, characterService) : true)
                    ))
                });
            SpecializationGains.forEach(critSpec => {
                let specs: Specialization[] = characterService.get_Specializations(this.group).map(spec => Object.assign(new Specialization(), spec).recast());
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
    get_EffectsGenerationObjects(creature: Creature, characterService: CharacterService): (Equipment | Specialization | Rune)[] {
        return super.get_EffectsGenerationObjects(creature, characterService)
            .concat(...this.get_ArmorSpecialization(creature, characterService))
            .concat(this.propertyRunes);
    }
    get_EffectsGenerationHints(): HintEffectsObject[] {
        return super.get_EffectsGenerationHints()
        .concat(...this.propertyRunes.map(rune => rune.get_EffectsGenerationHints()));
    }
}
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
import { Item } from './Item';

export class Armor extends Equipment {
    //Armor should be type "armors" to be found in the database
    readonly type = 'armors';
    //For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead
    //This value influences acbonus, skillpenalty, dexcap and strength
    public _affectedByArmoredSkirt: -1 | 0 | 1 = 0;
    //Shoddy armors give a penalty of -2 unless you have the Junk Tinker feat.
    public _shoddy: -2 | 0 = 0;
    //The armor's inherent bonus to AC.
    private readonly acbonus = 0;
    //What kind of armor is this based on? Needed for armor proficiencies for specific magical items.
    public armorBase = '';
    //The highest dex bonus to AC you can get while wearing this armor.
    //-1 is unlimited.
    public dexcap = -1;
    //The armor group, needed for critical specialization effects.
    public group = '';
    //Armor is usually moddable.
    moddable = true;
    //What proficiency is used? "Light Armor", "Medium Armor"?
    public prof = 'Light Armor';
    //The penalty to certain skills if your strength is lower than the armors requirement.
    //Should be a negative number
    private readonly skillpenalty = 0;
    //The penalty to all speeds if your strength is lower than the armors requirement.
    //Should be a negative number and a multiple of -5.
    public speedpenalty = 0;
    //The strength requirement (strength, not STR) to overcome skill and speed penalties.
    private readonly strength = 0;
    //A Dwarf with the Battleforger feat can polish armor to grant the effect of a +1 potency rune.
    public battleforged = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign<ArmorRune, Item>(new ArmorRune(), typeService.restoreItem(obj, itemsService)).recast(typeService, itemsService));
        this.material = this.material.map(obj => Object.assign(new ArmorMaterial(), obj).recast());

        return this;
    }
    protected _getSecondaryRuneName(): string {
        return this.getResilient(this.getResilientRune());
    }
    public get_Title(options: { itemStore?: boolean } = {}): string {
        const proficiency = options.itemStore ? this.prof : this.get_Proficiency();

        return [
            proficiency.split(' ')[0],
            this.group,
            proficiency.split(' ')[1],
        ].filter(part => part && part != 'Defense')
            .join(' ');
    }
    get_Price(itemsService: ItemsService) {
        let price = this.price;

        if (this.potencyRune) {
            price += itemsService.get_CleanItems().armorrunes.find(rune => rune.potency == this.potencyRune).price;
        }

        if (this.resilientRune) {
            price += itemsService.get_CleanItems().armorrunes.find(rune => rune.resilient == this.resilientRune).price;
        }

        price += this.propertyRunes.reduce((prev, next) => prev + next.price, 0);
        this.material.forEach(mat => {
            price += mat.price;

            if (parseInt(this.bulk, 10)) {
                price += (mat.bulkPrice * parseInt(this.bulk, 10));
            }
        });
        price += this.talismans.reduce((prev, next) => prev + next.price, 0);

        return price;
    }
    getBulk() {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk = '';

        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });

        //Fortification Runes raise the required strength
        const fortification = this.propertyRunes.filter(rune => rune.name.includes('Fortification')).length ? 1 : 0;

        if (parseInt(this.bulk, 10)) {
            return oilBulk || (parseInt(this.bulk, 10) + fortification).toString();
        } else {
            return oilBulk || fortification ? fortification.toString() : this.bulk;
        }

    }
    update_Modifiers(creature: Creature, services: { characterService: CharacterService; refreshService: RefreshService }) {
        //Initialize shoddy values and armored skirt.
        //Set components to update if these values have changed from before.
        const oldValues = [this._affectedByArmoredSkirt, this._shoddy];

        this.get_ArmoredSkirt(creature as AnimalCompanion | Character);
        this.get_Shoddy((creature as AnimalCompanion | Character), services.characterService);

        const newValues = [this._affectedByArmoredSkirt, this._shoddy];

        if (oldValues.some((previous, index) => previous != newValues[index])) {
            services.refreshService.set_ToChange(creature.type, 'inventory');
        }
    }
    get_ArmoredSkirt(creature: Creature, options: { itemStore?: boolean } = {}) {
        if (!options.itemStore && ['Breastplate', 'Chain Shirt', 'Chain Mail', 'Scale Mail'].includes(this.name)) {
            const armoredSkirt = creature.inventories.map(inventory => inventory.adventuringgear).find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

            if (armoredSkirt?.length) {
                this._affectedByArmoredSkirt = 1;

                return armoredSkirt[0];
            } else {
                this._affectedByArmoredSkirt = 0;

                return null;
            }
        } else if (!options.itemStore && ['Half Plate', 'Full Plate', 'Hellknight Plate'].includes(this.name)) {
            const armoredSkirt = creature.inventories.map(inventory => inventory.adventuringgear).find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

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
        if (this.shoddy && characterService.get_Feats('Junk Tinker')[0]?.have({ creature }, { characterService }) && this.crafted) {
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
        return this.acbonus + this._affectedByArmoredSkirt;
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
        const fortification = this.propertyRunes.filter(rune => rune.name.includes('Fortification')).length ? 2 : 0;
        //Some materials lower the required strength
        const material = this.material.map(material => (material as ArmorMaterial).strengthScoreModifier).reduce((a, b) => a + b, 0);

        return this.strength + (this._affectedByArmoredSkirt * 2) + fortification + material;
    }
    get_Proficiency(creature: Creature = null, characterService: CharacterService = null) {
        if (creature && characterService.get_AppliedConditions(creature, 'Mage Armor', '', true).length) {
            //While wearing mage armor, you use your unarmored proficiency to calculate your AC.
            return 'Unarmored Defense';
        }

        if (this._affectedByArmoredSkirt == 1) {
            switch (this.prof) {
                case 'Light Armor':
                    return 'Medium Armor';
                case 'Medium Armor':
                    return 'Heavy Armor';
            }
        } else {
            return this.prof;
        }
    }
    hasProficiencyChanged(currentProficiency: string) {
        return currentProficiency != this.prof;
    }
    //characterService and creature are not needed for armors, but for other implementations of item.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get_Traits(characterService?: CharacterService, creature?: Creature) {
        let traits = this.traits.filter(trait => !this.material.some(material => material.removeTraits.includes(trait)));

        if (this._affectedByArmoredSkirt != 0) {
            //An armored skirt makes your armor noisy if it isn't already.
            if (!traits.includes('Noisy')) {
                traits = traits.concat('Noisy');
            }
        }

        this._traits = traits;

        return traits;
    }
    profLevel(creature: Character | AnimalCompanion, characterService: CharacterService, charLevel: number = characterService.get_Character().level, options: { itemStore?: boolean } = {}) {
        if (characterService.still_loading()) { return 0; }

        this.get_ArmoredSkirt(creature, options);

        let skillLevel = 0;
        const armorLevel = characterService.get_Skills(creature, this.name, { type: 'Specific Weapon Proficiency' })[0].level(creature, characterService, charLevel);
        const proficiencyLevel = characterService.get_Skills(creature, this.get_Proficiency(creature, characterService))[0].level(creature, characterService, charLevel);

        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.min(Math.max(armorLevel, proficiencyLevel), 8);

        return skillLevel;
    }
    get_ArmorSpecialization(creature: Creature, characterService: CharacterService): Array<Specialization> {
        const SpecializationGains: Array<SpecializationGain> = [];
        const specializations: Array<Specialization> = [];
        const prof = this.get_Proficiency(creature, characterService);

        if (creature instanceof Character && this.group) {
            const character = creature as Character;
            const skillLevel = this.profLevel(character, characterService);

            characterService.get_CharacterFeatsAndFeatures()
                .filter(feat => feat.gainSpecialization.length && feat.have({ creature: character }, { characterService }))
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (spec.group ? (this.group && spec.group.includes(this.group)) : true) &&
                        (spec.name ? ((this.name && spec.name.includes(this.name)) || (this.armorBase && spec.name.includes(this.armorBase))) : true) &&
                        (spec.trait ? this.traits.filter(trait => trait && spec.trait.includes(trait)).length : true) &&
                        (spec.proficiency ? (prof && spec.proficiency.includes(prof)) : true) &&
                        (spec.skillLevel ? skillLevel >= spec.skillLevel : true) &&
                        (spec.featreq ? characterService.get_CharacterFeatsAndFeatures(spec.featreq)[0]?.have({ creature: character }, { characterService }) : true),
                    ));
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Array<Specialization> = characterService.get_Specializations(this.group).map(spec => Object.assign(new Specialization(), spec).recast());

                specs.forEach(spec => {
                    if (critSpec.condition) {
                        spec.desc = `(${ critSpec.condition }) ${ spec.desc }`;
                    }

                    if (!specializations.some(existingspec => JSON.stringify(existingspec) == JSON.stringify(spec))) {
                        specializations.push(spec);
                    }
                });
            });
        }

        return specializations;
    }
    getEffectsGenerationObjects(creature: Creature, characterService: CharacterService): Array<Equipment | Specialization | Rune> {
        return super.getEffectsGenerationObjects(creature, characterService)
            .concat(...this.get_ArmorSpecialization(creature, characterService))
            .concat(this.propertyRunes);
    }
    getEffectsGenerationHints(): Array<HintEffectsObject> {
        return super.getEffectsGenerationHints()
            .concat(...this.propertyRunes.map(rune => rune.getEffectsGenerationHints()));
    }
}

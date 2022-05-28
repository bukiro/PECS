//TO-DO: Resolve private properties either not matching JSON import or not having an underscore
/* eslint-disable @typescript-eslint/naming-convention */

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
import { AdventuringGear } from './AdventuringGear';
import { MaxSkillLevel } from '../../libs/shared/definitions/skillLevels';

enum ShoddyPenalties {
    NotShoddy = 0,
    Shoddy = -2,
}

export class Armor extends Equipment {
    //Armor should be type "armors" to be found in the database
    public readonly type = 'armors';
    /**
     * For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead.
     * This value influences acbonus, skillpenalty, dexcap and strength
     */
    public $affectedByArmoredSkirt: -1 | 0 | 1 = 0;
    /** Shoddy armors give a penalty of -2 unless you have the Junk Tinker feat. */
    public $shoddy: ShoddyPenalties = 0;
    /** What kind of armor is this based on? Needed for armor proficiencies for specific magical items. */
    public armorBase = '';
    /**
     * The highest dex bonus to AC you can get while wearing this armor.
     * -1 is unlimited.
     */
    public dexcap = -1;
    /** The armor group, needed for critical specialization effects. */
    public group = '';
    /** Armor is usually moddable. */
    public moddable = true;
    /** What proficiency is used? "Light Armor", "Medium Armor"? */
    public prof = 'Light Armor';
    /**
     * The penalty to all speeds if your strength is lower than the armors requirement.
     * Should be a negative number and a multiple of -5.
     */
    public speedpenalty = 0;
    /** A Dwarf with the Battleforger feat can polish armor to grant the effect of a +1 potency rune. */
    public battleforged = false;
    /** The armor's inherent bonus to AC. */
    private readonly acbonus = 0;
    /**
     * The penalty to certain skills if your strength is lower than the armors requirement.
     * Should be a negative number
     */
    private readonly skillpenalty = 0;
    /** The strength requirement (strength, not STR) to overcome skill and speed penalties. */
    private readonly strength = 0;
    public recast(typeService: TypeService, itemsService: ItemsService): Armor {
        super.recast(typeService, itemsService);
        this.propertyRunes =
            this.propertyRunes.map(obj =>
                Object.assign<ArmorRune, Item>(
                    new ArmorRune(),
                    typeService.restoreItem(obj, itemsService)).recast(typeService, itemsService),
            );
        this.material = this.material.map(obj => Object.assign(new ArmorMaterial(), obj).recast());

        return this;
    }
    public title(options: { itemStore?: boolean } = {}): string {
        const proficiency = options.itemStore ? this.prof : this.effectiveProficiency();

        return [
            proficiency.split(' ')[0],
            this.group,
            proficiency.split(' ')[1],
        ].filter(part => !!part && part !== 'Defense')
            .join(' ');
    }
    public effectivePrice(itemsService: ItemsService): number {
        let price = this.price;

        if (this.moddable) {
            if (this.potencyRune) {
                price += itemsService.cleanItems().armorrunes.find(rune => rune.potency === this.potencyRune).price;
            }

            if (this.resilientRune) {
                price += itemsService.cleanItems().armorrunes.find(rune => rune.resilient === this.resilientRune).price;
            }

            price += this.propertyRunes.reduce((prev, next) => prev + next.price, 0);
            this.material.forEach(mat => {
                price += mat.price;

                if (parseInt(this.bulk, 10)) {
                    price += (mat.bulkPrice * parseInt(this.bulk, 10));
                }

            });
        }

        price += this.talismans.reduce((prev, next) => prev + next.price, 0);

        return price;
    }
    public effectiveBulk(): string {
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
    public updateModifiers(creature: Creature, services: { characterService: CharacterService; refreshService: RefreshService }): void {
        //Initialize shoddy values and armored skirt.
        //Set components to update if these values have changed from before.
        const oldValues = [this.$affectedByArmoredSkirt, this.$shoddy];

        this.armoredSkirt(creature as AnimalCompanion | Character);
        this._effectiveShoddy((creature as AnimalCompanion | Character), services.characterService);

        const newValues = [this.$affectedByArmoredSkirt, this.$shoddy];

        if (oldValues.some((previous, index) => previous !== newValues[index])) {
            services.refreshService.prepareDetailToChange(creature.type, 'inventory');
        }
    }
    public armoredSkirt(creature: Creature, options: { itemStore?: boolean } = {}): AdventuringGear {
        if (!options.itemStore && ['Breastplate', 'Chain Shirt', 'Chain Mail', 'Scale Mail'].includes(this.name)) {
            const armoredSkirt =
                creature.inventories
                    .map(inventory => inventory.adventuringgear)
                    .find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

            if (armoredSkirt?.length) {
                this.$affectedByArmoredSkirt = 1;

                return armoredSkirt[0];
            } else {
                this.$affectedByArmoredSkirt = 0;

                return null;
            }
        } else if (!options.itemStore && ['Half Plate', 'Full Plate', 'Hellknight Plate'].includes(this.name)) {
            const armoredSkirt =
                creature.inventories
                    .map(inventory => inventory.adventuringgear)
                    .find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

            if (armoredSkirt?.length) {
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
    public effectiveACBonus(): number {
        return this.acbonus + this.$affectedByArmoredSkirt;
    }
    public effectiveSkillPenalty(): number {
        return Math.min(
            0,
            (
                this.skillpenalty -
                this.$affectedByArmoredSkirt +
                this.$shoddy +
                this.material.map(material => (material as ArmorMaterial).skillPenaltyModifier).reduce((a, b) => a + b, 0)
            ),
        );
    }
    public effectiveSpeedPenalty(): number {
        return Math.min(
            0,
            (
                this.speedpenalty +
                this.material.map(material => (material as ArmorMaterial).speedPenaltyModifier).reduce((a, b) => a + b, 0)
            ),
        );
    }
    public effectiveDexCap(): number {
        if (this.dexcap !== -1) {
            return this.dexcap - this.$affectedByArmoredSkirt;
        } else {
            return this.dexcap;
        }

    }
    public effectiveStrengthRequirement(): number {
        const fortificationIncrease = 2;
        const armoredSkirtMultiplier = 2;
        //Fortification Runes raise the required strength
        const fortificationFactor =
            this.propertyRunes.filter(rune => rune.name.includes('Fortification')).length ? fortificationIncrease : 0;
        //Some materials lower the required strength
        const materialFactor = this.material.map(material => (material as ArmorMaterial).strengthScoreModifier).reduce((a, b) => a + b, 0);

        return this.strength + (this.$affectedByArmoredSkirt * armoredSkirtMultiplier) + fortificationFactor + materialFactor;
    }
    public effectiveProficiency(creature: Creature = null, characterService: CharacterService = null): string {
        if (creature && characterService.currentCreatureConditions(creature, 'Mage Armor', '', true).length) {
            //While wearing mage armor, you use your unarmored proficiency to calculate your AC.
            return 'Unarmored Defense';
        }

        if (this.$affectedByArmoredSkirt === 1) {
            switch (this.prof) {
                case 'Light Armor':
                    return 'Medium Armor';
                case 'Medium Armor':
                    return 'Heavy Armor';
                default:
                    return this.prof;
            }
        } else {
            return this.prof;
        }
    }
    public hasProficiencyChanged(currentProficiency: string): boolean {
        return currentProficiency !== this.prof;
    }
    // characterService and creature are not needed for armors, but for other implementations of item.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public effectiveTraits(characterService?: CharacterService, creature?: Creature): Array<string> {
        let traits = this.traits.filter(trait => !this.material.some(material => material.removeTraits.includes(trait)));

        if (this.$affectedByArmoredSkirt !== 0) {
            //An armored skirt makes your armor noisy if it isn't already.
            if (!traits.includes('Noisy')) {
                traits = traits.concat('Noisy');
            }
        }

        this.$traits = traits;

        return this.$traits;
    }
    public profLevel(
        creature: Character | AnimalCompanion,
        characterService: CharacterService,
        charLevel: number = characterService.character.level,
        options: { itemStore?: boolean } = {},
    ): number {
        if (characterService.stillLoading) { return 0; }

        this.armoredSkirt(creature, options);

        let skillLevel = 0;
        const armorLevel =
            characterService.skills(creature, this.name, { type: 'Specific Weapon Proficiency' })[0]
                .level(creature, characterService, charLevel);
        const proficiencyLevel =
            characterService.skills(creature, this.effectiveProficiency(creature, characterService))[0]
                .level(creature, characterService, charLevel);

        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.min(Math.max(armorLevel, proficiencyLevel), MaxSkillLevel);

        return skillLevel;
    }
    public armorSpecializations(creature: Creature, characterService: CharacterService): Array<Specialization> {
        const SpecializationGains: Array<SpecializationGain> = [];
        const specializations: Array<Specialization> = [];
        const prof = this.effectiveProficiency(creature, characterService);

        if (creature instanceof Character && this.group) {
            const character = creature as Character;
            const skillLevel = this.profLevel(character, characterService);

            characterService.characterFeatsAndFeatures()
                .filter(feat => feat.gainSpecialization.length && feat.have({ creature: character }, { characterService }))
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (!spec.group || (this.group && spec.group.includes(this.group))) &&
                        (
                            !spec.name ||
                            ((this.name && spec.name.includes(this.name)) || (this.armorBase && spec.name.includes(this.armorBase)))
                        ) &&
                        (!spec.trait || this.traits.filter(trait => trait && spec.trait.includes(trait)).length) &&
                        (!spec.proficiency || (prof && spec.proficiency.includes(prof))) &&
                        (!spec.skillLevel || skillLevel >= spec.skillLevel) &&
                        (
                            !spec.featreq ||
                            characterService.characterFeatsAndFeatures(spec.featreq)[0]
                                ?.have({ creature: character }, { characterService })
                        ),
                    ));
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Array<Specialization> =
                    characterService.itemGroupSpecializations(this.group).map(spec => Object.assign(new Specialization(), spec).recast());

                specs.forEach(spec => {
                    if (critSpec.condition) {
                        spec.desc = `(${ critSpec.condition }) ${ spec.desc }`;
                    }

                    if (!specializations.some(existingspec => JSON.stringify(existingspec) === JSON.stringify(spec))) {
                        specializations.push(spec);
                    }
                });
            });
        }

        return specializations;
    }
    public effectsGenerationObjects(creature: Creature, characterService: CharacterService): Array<Equipment | Specialization | Rune> {
        return super.effectsGenerationObjects(creature, characterService)
            .concat(...this.armorSpecializations(creature, characterService))
            .concat(this.propertyRunes);
    }
    public effectsGenerationHints(): Array<HintEffectsObject> {
        return super.effectsGenerationHints()
            .concat(...this.propertyRunes.map(rune => rune.effectsGenerationHints()));
    }
    protected _secondaryRuneName(): string {
        return this.resilientTitle(this.effectiveResilient());
    }
    private _effectiveShoddy(creature: Creature, characterService: CharacterService): number {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.feats('Junk Tinker')[0]?.have({ creature }, { characterService }) && this.crafted) {
            this.$shoddy = ShoddyPenalties.NotShoddy;
        } else if (this.shoddy) {
            this.$shoddy = ShoddyPenalties.Shoddy;
        } else {
            this.$shoddy = ShoddyPenalties.NotShoddy;
        }

        return this.$shoddy;
    }
}

//TO-DO: Resolve private properties either not matching JSON import or not having an underscore
/* eslint-disable @typescript-eslint/naming-convention */

import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { Equipment } from 'src/app/classes/Equipment';
import { Specialization } from 'src/app/classes/Specialization';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { Creature } from 'src/app/classes/Creature';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Rune } from 'src/app/classes/Rune';
import { Item } from './Item';
import { AdventuringGear } from './AdventuringGear';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { ResilientTitleFromLevel } from 'src/libs/shared/util/runeUtils';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddyPenalties';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';

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
    public acbonus = 0;
    /**
     * The penalty to certain skills if your strength is lower than the armors requirement.
     * Should be a negative number
     */
    public skillpenalty = 0;
    /** The strength requirement (strength, not STR) to overcome skill and speed penalties. */
    public strength = 0;

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = ResilientTitleFromLevel;

    public get secondaryRune(): BasicRuneLevels {
        return this.resilientRune;
    }

    public set secondaryRune(value: BasicRuneLevels) {
        this.resilientRune = value;
    }

    public recast(itemsService: ItemsService): Armor {
        super.recast(itemsService);
        this.propertyRunes =
            this.propertyRunes.map(obj =>
                Object.assign<ArmorRune, Item>(
                    new ArmorRune(),
                    TypeService.restoreItem(obj, itemsService)).recast(itemsService),
            );
        this.material = this.material.map(obj => Object.assign(new ArmorMaterial(), obj).recast());

        return this;
    }

    public isArmor(): this is Armor { return true; }

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

    public effectiveTraits(): boolean { return true; }

    public effectsGenerationObjects(creature: Creature, characterService: CharacterService): Array<Equipment | Specialization | Rune> {
        return super.effectsGenerationObjects(creature, characterService)
            .concat(...this.armorSpecializations(creature, characterService))
            .concat(this.propertyRunes);
    }

    public effectsGenerationHints(): Array<HintEffectsObject> {
        return super.effectsGenerationHints()
            .concat(...this.propertyRunes.map(rune => rune.effectsGenerationHints()));
    }

    public armoredSkirt(creature: Creature, options: { itemStore?: boolean } = {}): AdventuringGear {
        if (options.itemStore) { return null; }

        const armoredSkirt =
            creature.inventories
                .map(inventory => inventory.adventuringgear)
                .find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

        if (armoredSkirt?.length) {
            return armoredSkirt[0];
        } else {
            return null;
        }
    }

    protected _secondaryRuneName(): string {
        return ResilientTitleFromLevel(this.effectiveResilient());
    }

}

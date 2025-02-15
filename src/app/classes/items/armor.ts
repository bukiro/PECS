import { BasicRuneLevels } from 'src/libs/shared/definitions/basic-rune-levels';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddy-penalties';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { resilientTitleFromLevel } from 'src/libs/shared/util/rune-utils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Creature } from '../creatures/creature';
import { AdventuringGear } from './adventuring-gear';
import { ArmorMaterial } from './armor-material';
import { ArmorRune } from './armor-rune';
import { Equipment } from './equipment';
import { safeParseInt, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { isTruthy } from 'src/libs/shared/util/type-guard-utils';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Armor>({
    primitives: [
        'armorBase',
        'dexcap',
        'group',
        'moddable',
        'prof',
        'speedpenalty',
        'acbonus',
        'skillpenalty',
        'strength',
        'battleforged',
    ],
    serializableArrays: {
        // Treat all materials on Armor as ArmorMaterial.
        material:
            () => obj => ArmorMaterial.from(obj),
    },
    messageSerializableArrays: {
        // Treat all propertyRunes on Armor as ArmorRune.
        propertyRunes:
            recastFns => obj =>
                recastFns.getItemPrototype<ArmorRune>(obj, { prototype: new ArmorRune() })
                    .with(obj, recastFns),
    },
});

export class Armor extends Equipment implements MessageSerializable<Armor> {
    //Armor should be type "armors" to be found in the database
    public readonly type: ItemTypes = 'armors';
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
    /** The armor's inherent bonus to AC. */
    public acbonus = 0;
    /**
     * The penalty to certain skills if your strength is lower than the armors requirement.
     * Should be a negative number
     */
    public skillpenalty = 0;
    /** The strength requirement (strength, not STR) to overcome skill and speed penalties. */
    public strength = 0;

    /** A Dwarf with the Battleforger feat can polish armor to grant the effect of a +1 potency rune. */
    public readonly battleforged = signal(false);

    public readonly armorMaterial = computed(() =>
        this.material().filter((material): material is ArmorMaterial => material.isArmorMaterial()),
    );

    public readonly armorRunes = computed(() =>
        this.propertyRunes().filter((rune): rune is ArmorRune => rune.isArmorRune()),
    );

    /**
     * For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead.
     * This value influences acbonus, skillpenalty, dexcap and strength
     */
    public effectiveArmoredSkirt$$ = signal<-1 | 0 | 1>(0);

    /** Shoddy armors give a penalty of -2 unless you have the Junk Tinker feat. */
    public effectiveShoddy$$ = signal(ShoddyPenalties.NotShoddy);

    public effectiveProficiencyWithoutEffects$$ = computed(() => {
        const armoredSkirtModifier = this.effectiveArmoredSkirt$$();

        if (armoredSkirtModifier === 1) {
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
    });

    public effectiveBulk$$ = computed(() => {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        const oilBulk = this.oilsApplied()
            .map(({ bulkEffect }) => bulkEffect)
            .filter(isTruthy)
            .pop();

        if (oilBulk) {
            return oilBulk;
        }

        //Fortification Runes raise the bulk by 1
        const fortificationBulk =
            this.propertyRunes().some(rune => stringEqualsCaseInsensitive(rune.name, 'Fortification', { allowPartialString: true }))
                ? 1
                : 0;

        const bulk = safeParseInt(this.bulk, 0);

        return String(bulk + fortificationBulk);
    });

    public effectiveACBonus$$ = computed(() =>
        this.effectiveArmoredSkirt$$() + this.acbonus,
    );

    public effectiveSkillPenalty$ = computed(() => {
        const armoredSkirtModifier = this.effectiveArmoredSkirt$$();
        const shoddy = this.effectiveShoddy$$();

        return Math.min(
            0,
            (
                this.skillpenalty
                - armoredSkirtModifier
                + shoddy
                + this.armorMaterial().map(material => material.skillPenaltyModifier)
                    .reduce((a, b) => a + b, 0)
            ),
        );
    });

    public effectiveSpeedPenalty$$ = computed(() =>
        Math.min(
            0,
            (
                this.speedpenalty +
                this.armorMaterial().map(material => material.speedPenaltyModifier)
                    .reduce((a, b) => a + b, 0)
            ),
        ));

    public effectiveDexCap$$ = computed(() => {
        const armoredSkirtModifier = this.effectiveArmoredSkirt$$();

        if (this.dexcap !== -1) {
            return this.dexcap - armoredSkirtModifier;
        } else {
            return this.dexcap;
        }
    });

    public effectiveStrengthRequirement$$ = computed(() => {
        const armoredSkirtModifier = this.effectiveArmoredSkirt$$();
        const armoredSkirtMultiplier = 2;

        const fortificationIncrease = 2;
        //Fortification Runes raise the required strength
        const fortificationFactor =
            this.propertyRunes().some(rune =>
                stringEqualsCaseInsensitive(rune.name, 'Fortification', { allowPartialString: true }),
            )
                ? fortificationIncrease
                : 0;
        //Some materials lower the required strength
        const materialFactor = this.armorMaterial()
            .map(material => material.strengthScoreModifier)
            .reduce((a, b) => a + b, 0);

        return this.strength + (armoredSkirtModifier * armoredSkirtMultiplier) + fortificationFactor + materialFactor;
    });

    public readonly secondaryRuneName$$ = computed(() => this.secondaryRuneTitleFunction(this.effectiveResilient$$()));

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = resilientTitleFromLevel;

    public get secondaryRune(): WritableSignal<BasicRuneLevels> {
        return this.resilientRune;
    }

    public static from(values: MaybeSerialized<Armor>, recastFns: RecastFns): Armor {
        return new Armor().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Armor>, recastFns: RecastFns): Armor {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Armor> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Armor> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Armor {
        return Armor.from(this, recastFns);
    }

    public isEqual(compared: Partial<Armor>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isArmor(): this is Armor { return true; }

    public title$$(options: { itemStore?: boolean } = {}): Signal<string> {
        return computed(() => {
            const proficiency = options.itemStore
                ? this.prof
                : this.effectiveProficiencyWithoutEffects$$();

            return [
                proficiency.split(' ')[0],
                this.group,
                proficiency.split(' ')[1],
            ].filter(part => !!part && part !== 'Defense')
                .join(' ');
        });
    }

    public hasProficiencyChanged(currentProficiency: string): boolean {
        return currentProficiency !== this.prof;
    }

    public armoredSkirt$$(creature: Creature, options: { itemStore?: boolean } = {}): Signal<AdventuringGear | undefined> {
        if (options.itemStore) { return signal(undefined).asReadonly(); }

        return computed(() =>
            creature.inventories()
                .map(inventory => inventory.adventuringgear())
                .map(gear => gear.find(item => item.isArmoredSkirt && item.equipped))
                .find(isTruthy),
        );
    }
}

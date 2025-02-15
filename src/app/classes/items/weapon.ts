import { BasicRuneLevels } from 'src/libs/shared/definitions/basic-rune-levels';
import { DiceSizes } from 'src/libs/shared/definitions/dice-sizes';
import { EmblazonArmamentSet } from 'src/libs/shared/definitions/interfaces/emblazon-armament-set';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddy-penalties';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weapon-proficiencies';
import { strikingTitleFromLevel } from 'src/libs/shared/util/rune-utils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { AlchemicalPoison } from './alchemical-poison';
import { Equipment } from './equipment';
import { WeaponMaterial } from './weapon-material';
import { WeaponRune } from './weapon-rune';
import { computed, Signal, signal } from '@angular/core';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Weapon>({
    primitives: [
        'type',
        'moddable',
        'ammunition',
        'criticalHint',
        'dicenum',
        'dicesize',
        'dmgType',
        'extraDamage',
        'group',
        'hands',
        'melee',
        'prof',
        'ranged',
        'reload',
        'weaponBase',
        'dexterityBased',
        'useHighestAttackProficiency',
        'battleforged',
        'bladeAlly',
        'large',
    ],
    primitiveObjects: [
        'emblazonArmament',
    ],
    serializableArrays: {
        material:
            () => obj => WeaponMaterial.from(obj),
    },
    messageSerializableArrays: {
        propertyRunes:
            recastFns => obj =>
                recastFns.getItemPrototype<WeaponRune>(obj, { type: 'weaponrunes' })
                    .with(obj, recastFns),
        poisonsApplied:
            recastFns => obj =>
                recastFns.getItemPrototype<AlchemicalPoison>(obj, { type: 'alchemicalpoisons' })
                    .with(obj, recastFns),
    },
});

export class Weapon extends Equipment implements MessageSerializable<Weapon> {
    //Weapons should be type "weapons" to be found in the database
    public type: ItemTypes = 'weapons';
    //Weapons are usually moddable.
    public moddable = true;
    /** What type of ammo is used? (Bolts, arrows...) */
    public ammunition = '';
    /** What happens on a critical hit with this weapon? */
    public criticalHint = '';
    /** Number of dice for Damage: usually 1 for an unmodified weapon. Use 0 to notate exactly <dicesize> damage (e.g. 1 damage = 0d1). */
    public dicenum = 1;
    /** Size of the damage dice: usually 4-12, but can be 0, 1, etc. */
    public dicesize = DiceSizes.D6;
    /** What is the damage type? Usually S, B or P, but may include combinations". */
    public dmgType = '';
    /** Some weapons add additional damage like +1d4F. Use get_ExtraDamage() to read. */
    public extraDamage = '';
    /** The weapon group, needed for critical specialization effects. */
    public group = '';
    /** How many hands are needed to wield this weapon? */
    public hands: string | number = '';
    /** Melee range in ft: 5 or 10 for weapons with Reach trait. */
    public melee = 0;
    /**
     * What proficiency is used? "Simple Weapons", "Unarmed Attacks", etc.?
     */
    public prof: WeaponProficiencies = WeaponProficiencies.Simple;
    /**
     * Ranged range in ft - also add for thrown weapons.
     * Weapons can have a melee and a ranged value, e.g. Daggers that can thrown.
     */
    public ranged = 0;
    /** How many actions to reload this ranged weapon? */
    public reload = '';
    /** What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items. */
    public weaponBase = '';
    /** Dexterity-based melee attacks force you to use dexterity for your attack modifier. */
    public dexterityBased = false;
    /** If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency. */
    public useHighestAttackProficiency = false;

    /** A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune. */
    public readonly battleforged = signal(false);
    /** A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally. */
    public readonly bladeAlly = signal(false);
    /** Giant Instinct Barbarians can wield larger weapons. */
    public readonly large = signal(false);
    /** Store any poisons applied to this item. There should be only one poison at a time. */
    public readonly poisonsApplied = signal<Array<AlchemicalPoison>>([]);
    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
    public readonly emblazonArmament = signal<EmblazonArmamentSet | undefined>(undefined);

    /** Shoddy weapons take a -2 penalty to attacks. */
    public readonly effectiveShoddy$$ = signal<ShoddyPenalties>(ShoddyPenalties.NotShoddy);
    //TODO: This should be computed and update when it has reason to.
    // I'm not sure how, because it relies on the deity service.
    public readonly effectiveEmblazonArmament$$ = signal<EmblazonArmamentSet | undefined>(undefined);

    public readonly weaponMaterial$$: Signal<Array<WeaponMaterial>> = computed(() =>
        this.material().filter((material): material is WeaponMaterial => material.isWeaponMaterial()),
    );
    public readonly weaponRunes$$: Signal<Array<WeaponRune>> = computed(() =>
        this.propertyRunes().filter((rune): rune is WeaponRune => rune.isWeaponRune()),
    );

    // The weapon should show as a ranged attack if it currently has the Thrown trait,
    // or if it is ranged and never had the Thrown trait.
    // If it had the Thrown trait and doesn't have it now, it should not show.
    public readonly shouldShowAsRanged$: Signal<boolean> = computed(() =>
        this.effectiveTraits$$().some(trait => trait.includes('Thrown'))
        || (
            !!this.ranged
            && !this.traits.some(trait => trait.includes('Thrown'))
        ),
    );

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = strikingTitleFromLevel;

    public readonly secondaryRune$$: Signal<BasicRuneLevels> = this.strikingRune.asReadonly();

    protected readonly _secondaryRuneName$$: Signal<string> = computed(() => {
        const striking = this.effectiveStriking$$();

        return this.secondaryRuneTitleFunction(striking);
    });

    protected _bladeAllyName$$: Signal<Array<string>> = computed(() => {
        const words: Array<string> = [];

        const hasBladeAlly = this.bladeAlly();

        if (hasBladeAlly) {
            this.bladeAllyRunes().forEach(rune => {
                let name: string = rune.name;

                if (rune.name.includes('(Greater)')) {
                    name = `Greater ${ rune.name.substring(0, rune.name.indexOf('(Greater)')) }`;
                } else if (rune.name.includes(', Greater)')) {
                    name = `Greater ${ rune.name.substring(0, rune.name.indexOf(', Greater)')) })`;
                }

                words.push(name);
            });
        }

        return words;
    });

    public static from(values: MaybeSerialized<Weapon>, recastFns: RecastFns): Weapon {
        return new Weapon().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Weapon>, recastFns: RecastFns): Weapon {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Weapon> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Weapon> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Weapon {
        return Weapon.from(this, recastFns);
    }

    public isEqual(compared: Partial<Weapon>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isWeapon(): this is Weapon { return true; }

    public setSecondaryRune(value: BasicRuneLevels): void {
        this.strikingRune.set(value);
    }

    public title(options: { itemStore?: boolean; preparedProficiency?: string } = {}): string {
        const proficiency = (options.itemStore || !options.preparedProficiency) ? this.prof : options.preparedProficiency;

        return [
            proficiency.split(' ')[0],
            this.group,
        ].filter(part => part)
            .join(' ');
    }

    public hasProficiencyChanged(currentProficiency: string): boolean {
        return currentProficiency !== this.prof;
    }

}

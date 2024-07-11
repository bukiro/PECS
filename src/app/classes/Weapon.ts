import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { DiceSizes } from 'src/libs/shared/definitions/diceSizes';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddyPenalties';
import { strikingTitleFromLevel } from 'src/libs/shared/util/runeUtils';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { EmblazonArmamentSet } from 'src/libs/shared/definitions/interfaces/emblazon-armament-set';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

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

    /** Shoddy weapons take a -2 penalty to attacks. */
    public effectiveShoddy$ = new BehaviorSubject<ShoddyPenalties>(ShoddyPenalties.NotShoddy);
    //TODO: This should be a true observable and update when it has reason to.
    // I'm not sure how, because it relies on the deity service.
    public effectiveEmblazonArmament$ = new BehaviorSubject<EmblazonArmamentSet | undefined>(undefined);

    public readonly battleforged$: BehaviorSubject<boolean>;
    public readonly bladeAlly$: BehaviorSubject<boolean>;
    public readonly large$: BehaviorSubject<boolean>;

    public readonly emblazonArmament$: BehaviorSubject<EmblazonArmamentSet | undefined>;

    public readonly weaponMaterial$: Observable<Array<WeaponMaterial>>;
    public readonly weaponRunes$: Observable<Array<WeaponRune>>;

    public readonly shouldShowAsRanged$: Observable<boolean>;

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = strikingTitleFromLevel;

    private _battleforged = false;
    private _bladeAlly = false;
    private _large = false;

    private _emblazonArmament?: EmblazonArmamentSet | undefined = undefined;

    private readonly _poisonsApplied = new OnChangeArray<AlchemicalPoison>();

    constructor() {
        super();

        this.battleforged$ = new BehaviorSubject(this._battleforged);
        this.bladeAlly$ = new BehaviorSubject(this._bladeAlly);
        this.emblazonArmament$ = new BehaviorSubject(this._emblazonArmament);
        this.large$ = new BehaviorSubject(this._large);
        this.weaponMaterial$ = this.material.values$
            .pipe(
                map(materials => materials.filter((material): material is WeaponMaterial => material.isWeaponMaterial())),
            );
        this.weaponRunes$ = this.propertyRunes.values$
            .pipe(
                map(runes => runes.filter((rune): rune is WeaponRune => rune.isWeaponRune())),
            );
        // The weapon should show as a ranged attack if it currently has the Thrown trait,
        // or if it is ranged and never had the Thrown trait.
        // If it had the Thrown trait and doesn't have it now, it should not show.
        this.shouldShowAsRanged$ =
            this.effectiveTraits$
                .pipe(
                    map(effectiveTraits =>
                        effectiveTraits.some(trait => trait.includes('Thrown'))
                        || (
                            !!this.ranged
                            && !this.traits.some(trait => trait.includes('Thrown'))
                        ),
                    ),
                );
    }

    public get battleforged(): boolean {
        return this._battleforged;
    }

    /** A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune. */
    public set battleforged(value: boolean) {
        this._battleforged = value;
        this.battleforged$.next(this._battleforged);
    }

    public get bladeAlly(): boolean {
        return this._bladeAlly;
    }

    /** A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally. */
    public set bladeAlly(value) {
        this._bladeAlly = value;
        this.bladeAlly$.next(this._bladeAlly);
    }

    public get emblazonArmament(): EmblazonArmamentSet | undefined {
        return this._emblazonArmament;
    }

    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
    public set emblazonArmament(value: EmblazonArmamentSet | undefined) {
        this._emblazonArmament = value;
        this.emblazonArmament$.next(this._emblazonArmament);
    }

    public get poisonsApplied(): OnChangeArray<AlchemicalPoison> {
        return this._poisonsApplied;
    }

    /** Store any poisons applied to this item. There should be only one poison at a time. */
    public set poisonsApplied(value: Array<AlchemicalPoison>) {
        this._poisonsApplied.setValues(...value);
    }

    public get large(): boolean {
        return this._large;
    }

    /** Giant Instinct Barbarians can wield larger weapons. */
    public set large(value: boolean) {
        this._large = value;
    }

    public get secondaryRune(): BasicRuneLevels {
        return this.strikingRune;
    }

    public set secondaryRune(value: BasicRuneLevels) {
        this.strikingRune = value;
    }

    public get weaponRunes(): Readonly<Array<WeaponRune>> {
        return this.propertyRunes.filter((rune): rune is WeaponRune => rune.isWeaponRune());
    }

    public get weaponMaterial(): Readonly<Array<WeaponMaterial>> {
        return this.material.filter((material): material is WeaponMaterial => material.isWeaponMaterial());
    }

    public static from(values: DeepPartial<Weapon>, recastFns: RecastFns): Weapon {
        return new Weapon().with(values, recastFns);
    }

    public with(values: DeepPartial<Weapon>, recastFns: RecastFns): Weapon {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Weapon> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Weapon> {
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

    protected _secondaryRuneName$(): Observable<string> {
        return this.effectiveStriking$()
            .pipe(
                map(striking => this.secondaryRuneTitleFunction(striking)),
            );
    }

    protected _bladeAllyName(): Array<string> {
        const words: Array<string> = [];

        if (this.bladeAlly) {
            this.bladeAllyRunes.forEach(rune => {
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
    }

}

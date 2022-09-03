import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { Item } from './Item';
import { DiceSizes } from 'src/libs/shared/definitions/diceSizes';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddyPenalties';
import { StrikingTitleFromLevel } from 'src/libs/shared/util/runeUtils';

interface EmblazonArmamentSet {
    type: string;
    choice: string;
    deity: string;
    alignment: string;
    emblazonDivinity: boolean;
    source: string;
}

export class Weapon extends Equipment {
    //Weapons should be type "weapons" to be found in the database
    public type = 'weapons';
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
    /** Store any poisons applied to this item. There should be only one poison at a time. */
    public poisonsApplied: Array<AlchemicalPoison> = [];
    /**
     * What proficiency is used? "Simple Weapons", "Unarmed Attacks", etc.?
     * Use get_Proficiency() to get the proficiency for numbers and effects.
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
    /** Giant Instinct Barbarians can wield larger weapons. */
    public large = false;
    /** A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally. */
    public bladeAlly = false;
    /** A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune. */
    public battleforged = false;
    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
    public emblazonArmament: Array<EmblazonArmamentSet> = [];
    public $emblazonArmament = false;
    public $emblazonEnergy = false;
    public $emblazonAntimagic = false;
    /** Dexterity-based melee attacks force you to use dexterity for your attack modifier. */
    public dexterityBased = false;
    /** If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency. */
    public useHighestAttackProficiency = false;
    public propertyRunes: Array<WeaponRune> = [];
    public material: Array<WeaponMaterial> = [];
    public $traits: Array<string> = [];
    /** Shoddy weapons take a -2 penalty to attacks. */
    public $shoddy: ShoddyPenalties = ShoddyPenalties.NotShoddy;

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = StrikingTitleFromLevel;

    public get secondaryRune(): BasicRuneLevels {
        return this.strikingRune;
    }

    public set secondaryRune(value: BasicRuneLevels) {
        this.strikingRune = value;
    }

    public recast(restoreFn: <T extends Item>(obj: T) => T): Weapon {
        super.recast(restoreFn);
        this.poisonsApplied = this.poisonsApplied.map(obj => Object.assign(new AlchemicalPoison(), restoreFn(obj)).recast(restoreFn));
        this.material = this.material.map(obj => Object.assign(new WeaponMaterial(), obj).recast());
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign(new WeaponRune(), restoreFn(obj)).recast(restoreFn));

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): Weapon {
        return Object.assign<Weapon, Weapon>(new Weapon(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
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

    protected _secondaryRuneName(): string {
        return this.secondaryRuneTitleFunction(this.effectiveStriking());
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

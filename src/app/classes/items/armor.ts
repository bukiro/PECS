import { BehaviorSubject, Observable, map, of, distinctUntilChanged, combineLatest } from 'rxjs';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basic-rune-levels';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ShoddyPenalties } from 'src/libs/shared/definitions/shoddy-penalties';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { resilientTitleFromLevel } from 'src/libs/shared/util/rune-utils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Creature } from '../creatures/creature';
import { AdventuringGear } from './adventuring-gear';
import { ArmorMaterial } from './armor-material';
import { ArmorRune } from './armor-rune';
import { Equipment } from './equipment';

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
                recastFns.getItemPrototype<ArmorRune>(obj, { type: 'armorrunes' })
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

    /**
     * For certain medium and light armors, set 1 if an "Armored Skirt" is equipped; For certain heavy armors, set -1 instead.
     * This value influences acbonus, skillpenalty, dexcap and strength
     */
    public effectiveArmoredSkirt$ = new BehaviorSubject<-1 | 0 | 1>(0);

    /** Shoddy armors give a penalty of -2 unless you have the Junk Tinker feat. */
    public effectiveShoddy$ = new BehaviorSubject<ShoddyPenalties>(ShoddyPenalties.NotShoddy);

    public readonly battleforged$: BehaviorSubject<boolean>;

    public readonly armorMaterial$: Observable<Array<ArmorMaterial>>;
    public readonly armorRunes$: Observable<Array<ArmorRune>>;

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = resilientTitleFromLevel;

    private _battleforged = false;

    constructor() {
        super();

        this.battleforged$ = new BehaviorSubject(this._battleforged);
        this.armorMaterial$ = this._material.values$
            .pipe(
                map(materials => materials.filter((material): material is ArmorMaterial => material.isArmorMaterial())),
            );
        this.armorRunes$ = this._propertyRunes.values$
            .pipe(
                map(runes => runes.filter((rune): rune is ArmorRune => rune.isArmorRune())),
            );
    }

    public get battleforged(): boolean {
        return this._battleforged;
    }

    /** A Dwarf with the Battleforger feat can polish armor to grant the effect of a +1 potency rune. */
    public set battleforged(value: boolean) {
        this._battleforged = value;
        this.battleforged$.next(this._battleforged);
    }

    public get secondaryRune(): BasicRuneLevels {
        return this.resilientRune;
    }

    public set secondaryRune(value: BasicRuneLevels) {
        this.resilientRune = value;
    }

    public get armorRunes(): Readonly<Array<ArmorRune>> {
        return this.propertyRunes.filter((rune): rune is ArmorRune => rune.isArmorRune());
    }

    public get armorMaterial(): Readonly<Array<ArmorMaterial>> {
        return this.material.filter((material): material is ArmorMaterial => material.isArmorMaterial());
    }

    public static from(values: DeepPartial<Armor>, recastFns: RecastFns): Armor {
        return new Armor().with(values, recastFns);
    }

    public with(values: DeepPartial<Armor>, recastFns: RecastFns): Armor {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Armor> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Armor> {
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

    public title$(options: { itemStore?: boolean } = {}): Observable<string> {
        return (
            options.itemStore
                ? of(this.prof)
                : this.effectiveProficiencyWithoutEffects$()
        )
            .pipe(
                map(proficiency => [
                    proficiency.split(' ')[0],
                    this.group,
                    proficiency.split(' ')[1],
                ].filter(part => !!part && part !== 'Defense')
                    .join(' '),
                ),
            );
    }

    public effectiveBulk(): string {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk = '';

        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect;
            }
        });

        //Fortification Runes raise the bulk by 1
        const fortification = this.propertyRunes.some(rune => rune.name.includes('Fortification')) ? 1 : 0;

        if (parseInt(this.bulk, 10)) {
            return oilBulk || (parseInt(this.bulk, 10) + fortification).toString();
        } else {
            return oilBulk || fortification ? fortification.toString() : this.bulk;
        }

    }

    public effectiveACBonus$(): Observable<number> {
        return this.effectiveArmoredSkirt$
            .pipe(
                distinctUntilChanged(),
                map(armoredSkirtModifier => armoredSkirtModifier + this.acbonus),
            );
    }

    public effectiveSkillPenalty$(): Observable<number> {
        return combineLatest([
            this.effectiveArmoredSkirt$,
            this.effectiveShoddy$,
        ])
            .pipe(
                distinctUntilChanged(),
                map(([armoredSkirtModifier, shoddy]) => Math.min(
                    0,
                    (
                        this.skillpenalty
                        - armoredSkirtModifier
                        + shoddy
                        + this.armorMaterial.map(material => material.skillPenaltyModifier).reduce((a, b) => a + b, 0)
                    ),
                )),
            );
    }

    public effectiveSpeedPenalty(): number {
        return Math.min(
            0,
            (
                this.speedpenalty +
                this.armorMaterial.map(material => material.speedPenaltyModifier).reduce((a, b) => a + b, 0)
            ),
        );
    }

    public effectiveDexCap$(): Observable<number> {
        return this.effectiveArmoredSkirt$
            .pipe(
                distinctUntilChanged(),
                map(armoredSkirtModifier => {
                    if (this.dexcap !== -1) {
                        return this.dexcap - armoredSkirtModifier;
                    } else {
                        return this.dexcap;
                    }
                }),
            );
    }

    public effectiveStrengthRequirement$(): Observable<number> {
        return this.effectiveArmoredSkirt$
            .pipe(
                distinctUntilChanged(),
                map(armoredSkirtModifier => {
                    const fortificationIncrease = 2;
                    const armoredSkirtMultiplier = 2;
                    //Fortification Runes raise the required strength
                    const fortificationFactor =
                        this.propertyRunes.some(rune => rune.name.includes('Fortification')) ? fortificationIncrease : 0;
                    //Some materials lower the required strength
                    const materialFactor = this.armorMaterial.map(material => material.strengthScoreModifier).reduce((a, b) => a + b, 0);

                    return this.strength + (armoredSkirtModifier * armoredSkirtMultiplier) + fortificationFactor + materialFactor;
                }),
            );
    }

    public effectiveProficiencyWithoutEffects$(): Observable<string> {
        return this.effectiveArmoredSkirt$
            .pipe(
                distinctUntilChanged(),
                map(armoredSkirtModifier => {
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
                }),
            );
    }

    public hasProficiencyChanged(currentProficiency: string): boolean {
        return currentProficiency !== this.prof;
    }

    public armoredSkirt(creature: Creature, options: { itemStore?: boolean } = {}): AdventuringGear | undefined {
        if (options.itemStore) { return undefined; }

        const armoredSkirt =
            creature.inventories
                .map(inventory => inventory.adventuringgear)
                .find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

        if (armoredSkirt?.length) {
            return armoredSkirt[0];
        } else {
            return undefined;
        }
    }

    protected _secondaryRuneName$(): Observable<string> {
        return this.effectiveResilient$()
            .pipe(
                map(resilient => this.secondaryRuneTitleFunction(resilient)),
            );
    }

}

import { BehaviorSubject, Observable, map, combineLatest } from 'rxjs';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { MaxSpellLevel } from 'src/libs/shared/definitions/spellLevels';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { strikingTitleFromLevel } from 'src/libs/shared/util/runeUtils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { LanguageGain } from '../creatures/character/language-gain';
import { Equipment } from './equipment';
import { Talisman } from './talisman';
import { WeaponRune } from './weapon-rune';

export interface RingOfWizardrySlot {
    tradition: string;
    level: number;
}

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<WornItem>({
    primitives: [
        'isDoublingRings',
        'isHandwrapsOfMightyBlows',
        'isWayfinder',
        'isAeonStone',
        'isBracersOfArmor',
        'isSlottedAeonStone',
        'isTalismanCord',
        'usage',
        'battleforged',
        'bladeAlly',
    ],
    primitiveObjectArrays: [
        'isRingOfWizardry',
    ],
    serializableArrays: {
        gainLanguages:
            () => obj => LanguageGain.from(obj),
    },
    messageSerializableArrays: {
        aeonStones:
            recastFns => obj =>
                recastFns.getItemPrototype<WornItem>(obj, { type: 'wornitems' })
                    .with(obj, recastFns),
        propertyRunes:
            recastFns => obj =>
                recastFns.getItemPrototype<WeaponRune>(obj, { type: 'weaponrunes' })
                    .with(obj, recastFns),
    },
});

export class WornItem extends Equipment implements MessageSerializable<WornItem> {
    //Allow changing of "equippable" by custom item creation.
    public readonly allowEquippable: boolean = false;
    //Worn Items cannot be equipped or unequipped, but can be invested.
    public readonly equippable: boolean = false;
    //Worn Items should be type "wornitems" to be found in the database.
    public readonly type: ItemTypes = 'wornitems';
    /** Does this item use the Doubling Rings functionality, and on which level? */
    public isDoublingRings: '' | 'Doubling Rings' | 'Doubling Rings (Greater)' = '';
    /** Does this item count for the "Handwraps of Mighty Blows" functionality? This will make it able to store runes. */
    public isHandwrapsOfMightyBlows = false;
    /** Does this item use the Wayfinder functionality to store Aeon Stones, and how many? */
    public isWayfinder = 0;
    /** Is this an Aeon Stone and can be stored in a Wayfinder? */
    public isAeonStone = false;
    /** Is this a pair of Bracers of Armor and lets you attach talismans like a light armor? */
    public isBracersOfArmor = false;
    /** Is this Aeon Stone slotted in a Wayfinder? */
    public isSlottedAeonStone = false;
    /** Is this a Talisman Cord and can be affixed to weapons, shields or armor, and how many schools is it attuned to? */
    public isTalismanCord = 0;
    /** How is this item worn? Example: "worn belt" */
    public usage = '';

    /** Is this a Ring of Wizardry and lets you pick a spellcasting to add one or more spells? */
    public isRingOfWizardry: Array<RingOfWizardrySlot> = [];

    /**
     * A worn item can grant you languages while invested, which can be listed here.
     * If the language is not locked, a text box will be available on the item to enter one.
     */
    public gainLanguages: Array<LanguageGain> = [];

    public readonly battleforged$: BehaviorSubject<boolean>;
    public readonly bladeAlly$: BehaviorSubject<boolean>;

    public readonly weaponRunes$: Observable<Array<WeaponRune>>;

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = strikingTitleFromLevel;

    private _battleforged = false;
    private _bladeAlly = false;

    private readonly _aeonStones = new OnChangeArray<WornItem>();

    constructor() {
        super();

        this.battleforged$ = new BehaviorSubject(this._battleforged);
        this.bladeAlly$ = new BehaviorSubject(this._bladeAlly);

        this.weaponRunes$ = this.propertyRunes.values$
            .pipe(
                map(runes => runes.filter((rune): rune is WeaponRune => rune.isWeaponRune())),
            );
    }


    public get battleforged(): boolean {
        return this._battleforged;
    }
    /**
     * A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune.
     * This applies to Handwraps of Mighty Blows only.
     */

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

    public get aeonStones(): OnChangeArray<WornItem> {
        return this._aeonStones;
    }

    /** List any Aeon Stones equipped in this item (only for Wayfinders). */
    public set aeonStones(value: Array<WornItem>) {
        this._aeonStones.setValues(...value);
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

    public static from(values: DeepPartial<WornItem>, recastFns: RecastFns): WornItem {
        return new WornItem().with(values, recastFns);
    }

    public with(values: DeepPartial<WornItem>, recastFns: RecastFns): WornItem {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<WornItem> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<WornItem> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): WornItem {
        return WornItem.from(this, recastFns);
    }

    public isEqual(compared: Partial<WornItem>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isWornItem(): this is WornItem { return true; }

    public effectsGenerationHints$(): Observable<Array<HintEffectsObject>> {
        //Aeon Stones have hints that can be resonant, meaning they are only displayed if the stone is slotted.
        //After collecting the hints, we keep the resonant ones only if the item is slotted.
        //Then we add the hints of any slotted aeon stones of this item, with the same rules.
        return combineLatest([
            super.effectsGenerationHints$()
                .pipe(
                    map(hintSets => hintSets.filter(hintSet => hintSet.hint.resonant ? this.isSlottedAeonStone : true)),
                ),
            ...this.aeonStones.map(stone => stone.effectsGenerationHints$()),
        ])
            .pipe(
                map(hintSets =>
                    new Array<HintEffectsObject>()
                        .concat(...hintSets)),
            );
    }

    public isCompatibleWithTalisman(talisman: Talisman): boolean {
        return this.isTalismanCord ?
            (
                this.level >= talisman.level &&
                this.data.some(data =>
                    talisman.traits.includes(data.value.toString()),
                )
            ) :
            false;
    }

    protected _secondaryRuneName$(): Observable<string> {
        return this.effectiveStriking$()
            .pipe(
                map(striking => this.secondaryRuneTitleFunction(striking)),
            );
    }

    private _initializeDoublingRings(): void {
        const goldRingIndex = 0;
        const ironRingIndex = 1;
        const propertyRunesIndex = 2;

        if (this.isDoublingRings) {
            if (!this.data[goldRingIndex]) {
                this.data.push({ name: 'gold', show: false, type: 'string', value: '' });
            }

            if (!this.data[ironRingIndex]) {
                this.data.push({ name: 'iron', show: false, type: 'string', value: '' });
            }

            if (!this.data[propertyRunesIndex]) {
                this.data.push({ name: 'propertyRunes', show: false, type: 'string', value: '' });
            }
        } else if (this.isTalismanCord) {
            if (!this.data[goldRingIndex]) {
                this.data.push({ name: 'Attuned magic school', show: false, type: 'string', value: 'no school attuned' });
            }

            if (!this.data[ironRingIndex]) {
                this.data.push({ name: 'Second attuned magic school', show: false, type: 'string', value: 'no school attuned' });
            }

            if (!this.data[propertyRunesIndex]) {
                this.data.push({ name: 'Third attuned magic school', show: false, type: 'string', value: 'no school attuned' });
            }
        } else if (this.isRingOfWizardry.length) {
            this.isRingOfWizardry.forEach((wizardrySlot, index) => {
                wizardrySlot.level = Math.max(Math.min(MaxSpellLevel, wizardrySlot.level), 0);

                if (!this.data[index]) {
                    this.data.push({ name: 'wizardrySlot', show: false, type: 'string', value: 'no spellcasting selected' });
                }
            });
        }
    }
}

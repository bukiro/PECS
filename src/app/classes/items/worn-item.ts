import { BasicRuneLevels } from 'src/libs/shared/definitions/basic-rune-levels';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { MaxSpellLevel } from 'src/libs/shared/definitions/spell-levels';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/hint-effects-object';
import { strikingTitleFromLevel } from 'src/libs/shared/util/rune-utils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { LanguageGain } from '../creatures/character/language-gain';
import { Equipment } from './equipment';
import { Talisman } from './talisman';
import { WeaponRune } from './weapon-rune';
import { computed, Signal, signal } from '@angular/core';

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
    /** Is this a Ring of Wizardry and lets you pick a spellcasting to add one or more spells? */
    public isRingOfWizardry: Array<RingOfWizardrySlot> = [];
    /** Is this a Talisman Cord and can be affixed to weapons, shields or armor, and how many schools is it attuned to? */
    public isTalismanCord = 0;
    /** How is this item worn? Example: "worn belt" */
    public usage = '';

    /**
     * A worn item can grant you languages while invested, which can be listed here.
     * If the language is not locked, a text box will be available on the item to enter one.
     */
    public gainLanguages: Array<LanguageGain> = [];

    /**
     * A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune.
     * This applies to Handwraps of Mighty Blows only.
     */
    public readonly battleforged = signal(false);
    /** A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally. */
    public readonly bladeAlly = signal(false);
    /** List any Aeon Stones equipped in this item (only for Wayfinders). */
    public readonly aeonStones = signal<Array<WornItem>>([]);

    public readonly weaponRunes$$: Signal<Array<WeaponRune>> = computed(() =>
        this.propertyRunes().filter((rune): rune is WeaponRune => rune.isWeaponRune()),
    );

    public readonly secondaryRune$$: Signal<BasicRuneLevels> = this.strikingRune.asReadonly();

    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = strikingTitleFromLevel;

    public readonly effectsGenerationHints$$: Signal<Array<HintEffectsObject>> = computed(() =>
        //Aeon Stones have hints that can be resonant, meaning they are only displayed if the stone is slotted.
        //After collecting the hints, we keep the resonant ones only if the item is slotted.
        //Then we add the hints of any slotted aeon stones of this item, with the same rules.
        [
            this._equipmentEffectsGenerationHints$$()
                .filter(hintSet => hintSet.hint.resonant ? this.isSlottedAeonStone : true),
            ...this.aeonStones().map(stone => stone.effectsGenerationHints$$()),
        ].flat(),
    );

    protected readonly _secondaryRuneName$$: Signal<string> = computed(() => {
        const striking = this.effectiveStriking$$();

        return this.secondaryRuneTitleFunction(striking);
    });

    public static from(values: MaybeSerialized<WornItem>, recastFns: RecastFns): WornItem {
        return new WornItem().with(values, recastFns);
    }

    public with(values: MaybeSerialized<WornItem>, recastFns: RecastFns): WornItem {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        this._initializeData();

        return this;
    }

    public forExport(): Serialized<WornItem> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<WornItem> {
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

    public setSecondaryRune(value: BasicRuneLevels): void {
        this.strikingRune.set(value);
    }

    public isCompatibleWithTalisman$$(talisman: Talisman): Signal<boolean> {
        return this.isTalismanCord ?
            computed(() => (
                this.level >= talisman.level &&
                this.data().some(data =>
                    talisman.traits.includes(data.value.toString()),
                )
            )) :
            signal(false);
    }

    private _initializeData(): void {
        const goldRingOrFirstSchoolIndex = 0;
        const ironRingOrSecondSchoolIndex = 1;
        const propertyRunesOrThirdSchoolIndex = 2;

        if (this.isDoublingRings) {
            if (!this.data()[goldRingOrFirstSchoolIndex]) {
                this.data.update(value => {
                    value[goldRingOrFirstSchoolIndex] =
                        { name: 'gold', show: false, type: 'string', value: '' };

                    return [...value];
                });
            }

            if (!this.data()[ironRingOrSecondSchoolIndex]) {
                this.data.update(value => {
                    value[ironRingOrSecondSchoolIndex] =
                        { name: 'iron', show: false, type: 'string', value: '' };

                    return [...value];
                });
            }

            if (!this.data()[propertyRunesOrThirdSchoolIndex]) {
                this.data.update(value => {
                    value[propertyRunesOrThirdSchoolIndex] =
                        { name: 'propertyRunes', show: false, type: 'string', value: '' };

                    return [...value];
                });
            }
        } else if (this.isTalismanCord) {
            if (!this.data()[goldRingOrFirstSchoolIndex]) {
                this.data.update(value => {
                    value[goldRingOrFirstSchoolIndex] =
                        { name: 'Attuned magic school', show: false, type: 'string', value: 'no school attuned' };

                    return [...value];
                });
            }

            if (!this.data()[ironRingOrSecondSchoolIndex]) {
                this.data.update(value => {
                    value[ironRingOrSecondSchoolIndex] =
                        { name: 'Second attuned magic school', show: false, type: 'string', value: 'no school attuned' };

                    return [...value];
                });
            }

            if (!this.data()[propertyRunesOrThirdSchoolIndex]) {
                this.data.update(value => {
                    value[propertyRunesOrThirdSchoolIndex] =
                        { name: 'Third attuned magic school', show: false, type: 'string', value: 'no school attuned' };

                    return [...value];
                });
            }
        } else if (this.isRingOfWizardry.length) {
            this.isRingOfWizardry.forEach((wizardrySlot, index) => {
                wizardrySlot.level = Math.max(Math.min(MaxSpellLevel, wizardrySlot.level), 0);

                if (!this.data()[index]) {
                    this.data.update(value => {
                        value[index] = { name: 'wizardrySlot', show: false, type: 'string', value: 'no spellcasting selected' };

                        return [...value];
                    });
                }
            });
        }
    }
}

import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { LanguageGain } from './LanguageGain';
import { Talisman } from './Talisman';
import { MaxSpellLevel } from 'src/libs/shared/definitions/spellLevels';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { strikingTitleFromLevel } from 'src/libs/shared/util/runeUtils';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject } from 'rxjs';

export interface RingOfWizardrySlot {
    tradition: string;
    level: number;
}

export class WornItem extends Equipment {
    //Allow changing of "equippable" by custom item creation.
    public readonly allowEquippable = false;
    //Worn Items cannot be equipped or unequipped, but can be invested.
    public readonly equippable = false;
    //Worn Items should be type "wornitems" to be found in the database.
    public readonly type = 'wornitems';
    /** List any Aeon Stones equipped in this item (only for Wayfinders). */
    public aeonStones: Array<WornItem> = [];
    /** Does this item use the Doubling Rings functionality, and on which level? */
    public isDoublingRings: '' | 'Doubling Rings' | 'Doubling Rings (Greater)' = '';
    /** Does this item count for the "Handwraps of Mighty Blows" functionality? This will make it able to store runes. */
    public isHandwrapsOfMightyBlows = false;
    /** A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally. */
    public bladeAlly = false;
    /** Does this item use the Wayfinder functionality to store Aeon Stones, and how many? */
    public isWayfinder = 0;
    /** Is this an Aeon Stone and can be stored in a Wayfinder? */
    public isAeonStone = false;
    /** Is this Aeon Stone slotted in a Wayfinder? */
    public isSlottedAeonStone = false;
    /** Is this a Talisman Cord and can be affixed to weapons, shields or armor, and how many schools is it attuned to? */
    public isTalismanCord = 0;
    /** How is this item worn? Example: "worn belt" */
    public usage = '';
    /**
     * A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune.
     * This applies to Handwraps of Mighty Blows only.
     */
    public battleforged = false;
    /**
     * A worn item can grant you languages while invested, which can be listed here.
     * If the language is not locked, a text box will be available on the item to enter one.
     */
    public gainLanguages: Array<LanguageGain> = [];
    /** Is this a Ring of Wizardry and lets you pick a spellcasting to add one or more spells? */
    public isRingOfWizardry: Array<RingOfWizardrySlot> = [];
    /** Is this a pair of Bracers of Armor and lets you attach talismans like a light armor? */
    public isBracersOfArmor = false;
    public readonly secondaryRuneTitleFunction: ((secondary: number) => string) = strikingTitleFromLevel;
    public propertyRunes: Array<WeaponRune> = [];

    public runesChanged$ = new BehaviorSubject<true>(true);

    public get secondaryRune(): BasicRuneLevels {
        return this.strikingRune;
    }

    public set secondaryRune(value: BasicRuneLevels) {
        this.strikingRune = value;
    }

    public recast(recastFns: RecastFns): WornItem {
        super.recast(recastFns);
        this.aeonStones =
            this.aeonStones.map(obj =>
                Object.assign(
                    new WornItem(),
                    recastFns.item(obj),
                ).recast(recastFns),
            );
        this.propertyRunes =
            this.propertyRunes.map(obj =>
                Object.assign(
                    new WeaponRune(),
                    recastFns.item(obj),
                ).recast(recastFns),
            );
        this.gainLanguages =
            this.gainLanguages.map(obj =>
                Object.assign(new LanguageGain(), obj).recast());

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

        return this;
    }

    public clone(recastFns: RecastFns): WornItem {
        return Object.assign<WornItem, WornItem>(
            new WornItem(),
            JSON.parse(JSON.stringify({ ...this, runesChanged$: null })),
        ).recast(recastFns);
    }

    public isWornItem(): this is WornItem { return true; }

    public effectsGenerationHints(): Array<HintEffectsObject> {
        //Aeon Stones have hints that can be resonant, meaning they are only displayed if the stone is slotted.
        //After collecting the hints, we keep the resonant ones only if the item is slotted.
        //Then we add the hints of any slotted aeon stones of this item, with the same rules.
        return super.effectsGenerationHints()
            .filter(hintSet => hintSet.hint.resonant ? this.isSlottedAeonStone : true)
            .concat(...this.aeonStones.map(stone => stone.effectsGenerationHints()));
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

    protected _secondaryRuneName(): string {
        return this.secondaryRuneTitleFunction(this.effectiveStriking());
    }
}

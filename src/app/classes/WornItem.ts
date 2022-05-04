import { Equipment } from 'src/app/classes/Equipment';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { Specialization } from 'src/app/classes/Specialization';
import { Rune } from 'src/app/classes/Rune';
import { Item } from './Item';
import { LanguageGain } from './LanguageGain';
import { Talisman } from './Talisman';

export interface RingOfWizardrySlot {
    tradition: string;
    level: number;
}

export class WornItem extends Equipment {
    //Allow changing of "equippable" by custom item creation.
    readonly allowEquippable = false;
    //Worn Items cannot be equipped or unequipped, but can be invested.
    readonly equippable = false;
    //Worn Items should be type "wornitems" to be found in the database.
    readonly type = 'wornitems';
    //List any Aeon Stones equipped in this item (only for Wayfinders).
    public aeonStones: Array<WornItem> = [];
    //Does this item use the Doubling Rings functionality, and on which level?
    public isDoublingRings: '' | 'Doubling Rings' | 'Doubling Rings (Greater)' = '';
    //Does this item count for the "Handwraps of Mighty Blows" functionality? This will make it able to store runes.
    public isHandwrapsOfMightyBlows = false;
    //A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally.
    public bladeAlly = false;
    //Does this item use the Wayfinder functionality to store Aeon Stones, and how many?
    public isWayfinder = 0;
    //Is this an Aeon Stone and can be stored in a Wayfinder?
    public isAeonStone = false;
    //Is this Aeon Stone slotted in a Wayfinder?
    public isSlottedAeonStone = false;
    //Is this a Talisman Cord and can be affixed to weapons, shields or armor, and how many schools is it attuned to?
    public isTalismanCord = 0;
    //How is this item worn? Example: "worn belt"
    public usage = '';
    //A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune. This applies to Handwraps of Mighty Blows only.
    public battleforged = false;
    //A worn item can grant you languages while invested, which can be listed here. If the language is not locked, a text box will be available on the item to enter one.
    public gainLanguages: Array<LanguageGain> = [];
    //Is this a Ring of Wizardry and lets you pick a spellcasting to add one or more spells?
    public isRingOfWizardry: Array<RingOfWizardrySlot> = [];
    //Is this a pair of Bracers of Armor and lets you attach talismans like a light armor?
    public isBracersOfArmor = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.aeonStones = this.aeonStones.map(obj => Object.assign<WornItem, Item>(new WornItem(), typeService.restoreItem(obj, itemsService)).recast(typeService, itemsService));
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign<WeaponRune, Item>(new WeaponRune(), typeService.restoreItem(obj, itemsService)).recast(typeService, itemsService));
        if (this.isDoublingRings) {
            if (!this.data[0]) {
                this.data.push({ name: 'gold', show: false, type: 'string', value: '' });
            }
            if (!this.data[1]) {
                this.data.push({ name: 'iron', show: false, type: 'string', value: '' });
            }
            if (!this.data[2]) {
                this.data.push({ name: 'propertyRunes', show: false, type: 'string', value: '' });
            }
        } else if (this.isTalismanCord) {
            if (!this.data[0]) {
                this.data.push({ name: 'Attuned magic school', show: false, type: 'string', value: 'no school attuned' });
            }
            if (!this.data[1]) {
                this.data.push({ name: 'Second attuned magic school', show: false, type: 'string', value: 'no school attuned' });
            }
            if (!this.data[2]) {
                this.data.push({ name: 'Third attuned magic school', show: false, type: 'string', value: 'no school attuned' });
            }
        } else if (this.isRingOfWizardry.length) {
            this.isRingOfWizardry.forEach((wizardrySlot, index) => {
                wizardrySlot.level = Math.max(Math.min(10, wizardrySlot.level), 0);
                if (!this.data[index]) {
                    this.data.push({ name: 'wizardrySlot', show: false, type: 'string', value: 'no spellcasting selected' });
                }
            });
        }
        return this;
    }
    protected _getSecondaryRuneName(): string {
        return this.getStriking(this.getStrikingRune());
    }
    get_Price(itemsService: ItemsService) {
        let price = this.price;
        if (this.potencyRune) {
            price += itemsService.get_CleanItems().weaponrunes.find(rune => rune.potency == this.potencyRune).price;
        }
        if (this.strikingRune) {
            price += itemsService.get_CleanItems().weaponrunes.find(rune => rune.striking == this.strikingRune).price;
        }
        price += this.propertyRunes.reduce((prev, next) => prev + next.price, 0);
        price += this.aeonStones.reduce((prev, next) => prev + next.price, 0);
        return price;
    }
    get_Traits(characterService: CharacterService, creature: Creature): Array<string> {
        return super.get_Traits(characterService, creature)
            .concat(
                this.isTalismanCord ?
                    this.data
                        .map(data => data.value.toString())
                        .filter(trait =>
                            !this.traits.includes(trait) && trait !== 'no school attuned'
                        ) :
                    []
            );
    }
    get_CompatibleWithTalisman(talisman: Talisman) {
        return this.isTalismanCord ?
            (
                this.level >= talisman.level &&
                this.data.some(data =>
                    talisman.traits.includes(data.value.toString())
                )
            ) :
            false;
    }
    getEffectsGenerationObjects(creature: Creature, characterService: CharacterService): Array<Equipment | Specialization | Rune> {
        return super.getEffectsGenerationObjects(creature, characterService)
            .concat(...this.aeonStones);
    }
    getEffectsGenerationHints(): Array<HintEffectsObject> {
        //Aeon Stones have hints that can be resonant, meaning they are only displayed if the stone is slotted.
        //After collecting the hints, we keep the resonant ones only if the item is slotted.
        //Then we add the hints of any slotted aeon stones of this item, with the same rules.
        return super.getEffectsGenerationHints()
            .filter(hintSet => hintSet.hint.resonant ? this.isSlottedAeonStone : true)
            .concat(...this.aeonStones.map(stone => stone.getEffectsGenerationHints()));
    }
}

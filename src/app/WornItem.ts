import { Equipment } from './Equipment';
import { HintEffectsObject } from './effectsGeneration.service';
import { ItemsService } from './items.service';
import { TypeService } from './type.service';
import { WeaponRune } from './WeaponRune';
import { CharacterService } from './character.service';
import { Creature } from './Creature';
import { Specialization } from './Specialization';
import { Rune } from './Rune';

export class WornItem extends Equipment {
    //Allow changing of "equippable" by custom item creation.
    readonly allowEquippable = false;
    //Worn Items cannot be equipped or unequipped, but can be invested.
    readonly equippable = false;
    //Worn Items should be type "wornitems" to be found in the database.
    readonly type = "wornitems";
    //List any Aeon Stones equipped in this item (only for Wayfinders).
    public aeonStones: WornItem[] = [];
    //Does this item use the Doubling Rings functionality, and on which level?
    public isDoublingRings: "" | "Doubling Rings" | "Doubling Rings (Greater)" = "";
    //Does this item count for the "Handwraps of Mighty Blows" functionality? This will make it able to store runes.
    public isHandwrapsOfMightyBlows: boolean = false;
    //A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally.
    public bladeAlly: boolean = false;
    //Does this item use the Wayfinder functionality to store Aeon Stones, and how many?
    public isWayfinder: number = 0;
    //Is this an Aeon Stone and can be stored in a Wayfinder?
    public isAeonStone: boolean = false;
    //Is this Aeon Stone slotted in a Wayfinder?
    public isSlottedAeonStone: boolean = false;
    //Is this a Talisman Cord and can be affixed to weapons, shields or armor, and how many schools is it attuned to?
    public isTalismanCord: number = 0;
    //How is this item worn? Example: "worn belt"
    public usage: string = "";
    //A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune. This applies to Handwraps of Mighty Blows only.
    public battleforged: boolean = false;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.aeonStones = this.aeonStones.map(obj => Object.assign<WornItem, WornItem>(new WornItem(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign<WeaponRune, WeaponRune>(new WeaponRune(), typeService.restore_Item(obj, itemsService)).recast(typeService, itemsService));
        return this;
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let words: string[] = [];
            let potency = this.get_Potency(this.get_PotencyRune());
            if (potency) {
                words.push(potency);
            }
            let secondary: string = "";
            secondary = this.get_Striking(this.get_StrikingRune());
            if (secondary) {
                words.push(secondary);
            }
            this.propertyRunes.forEach(rune => {
                let name: string = rune.name;
                if (rune.name.includes("(Greater)")) {
                    name = "Greater " + rune.name.substr(0, rune.name.indexOf("(Greater)"));
                } else if (rune.name.includes(", Greater)")) {
                    name = "Greater " + rune.name.substr(0, rune.name.indexOf(", Greater)")) + ")";
                }
                words.push(name);
            })
            if (this["bladeAlly"]) {
                this.bladeAllyRunes.forEach(rune => {
                    let name: string = rune.name;
                    if (rune.name.includes("(Greater)")) {
                        name = "Greater " + rune.name.substr(0, rune.name.indexOf("(Greater)"));
                    } else if (rune.name.includes(", Greater)")) {
                        name = "Greater " + rune.name.substr(0, rune.name.indexOf(", Greater)")) + ")";
                    }
                    words.push(name);
                })
            }
            words.push(this.name)
            return words.join(" ");
        }
    }
    get_Price(itemsService: ItemsService) {
        let price = this.price;
        if (this.potencyRune) {
            price += itemsService.get_CleanItems().weaponrunes.find(rune => rune.potency == this.potencyRune).price;
        }
        if (this.strikingRune) {
            price += itemsService.get_CleanItems().weaponrunes.find(rune => rune.striking == this.strikingRune).price;
        }
        this.propertyRunes.forEach(rune => {
            price += itemsService.get_CleanItems().weaponrunes.find(weaponRune => weaponRune.name.toLowerCase() == rune.name.toLowerCase()).price;
        })
        this.aeonStones.forEach(aeonStone => {
            price += itemsService.get_CleanItems().wornitems.find(wornItem => wornItem.name.toLowerCase() == aeonStone.name.toLowerCase()).price;
        })
        return price;
    }
    get_EffectsGenerationObjects(creature: Creature, characterService: CharacterService): (Equipment | Specialization | Rune)[] {
        return super.get_EffectsGenerationObjects(creature, characterService)
            .concat(...this.aeonStones);
    }
    get_EffectsGenerationHints(): HintEffectsObject[] {
        //Aeon Stones have hints that can be resonant, meaning they are only displayed if the stone is slotted.
        //After collecting the hints, we keep those that are either noth resonant and slotted, or neither.
        //Then we add the hints of any slotted aeon stones of this item, with the same rules.
        return super.get_EffectsGenerationHints()
            .filter(hintSet => hintSet.hint.resonant == this.isSlottedAeonStone)
            .concat(...this.aeonStones.map(stone => stone.get_EffectsGenerationHints()));
    }
}
import { Equipment } from './Equipment';
import { ItemActivity } from './ItemActivity';
import { ItemsService } from './items.service';

export class WornItem extends Equipment {
    public readonly _className: string = this.constructor.name;
    //Allow changing of "equippable" by custom item creation.
    readonly allowEquippable = false;
    //Worn Items cannot be equipped or unequipped, but can be invested.
    readonly equippable = false;
    //Worn Items should be type "wornitems" to be found in the database.
    readonly type = "wornitems";
    //List any Aeon Stones equipped in this item (only for Wayfinders).
    public aeonStones: WornItem[] = [];
    //Does this item use the Doubling Rings functionality, and on which level?
    public isDoublingRings: ""|"Doubling Rings"|"Doubling Rings (Greater)" = "";
    //Does this item count for the "Handwraps of Mighty Blows" functionality? If so, be sure to make it moddable like a weapon.
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
    get_Price(itemsService: ItemsService) {
        let price = this.price;
        if (this.moddable == "weapon") {
            if (this.potencyRune) {
                price += itemsService.get_CleanItems().weaponrunes.filter(rune => rune.potency == this.potencyRune)[0].price;
            }
            if (this.strikingRune) {
                price += itemsService.get_CleanItems().weaponrunes.filter(rune => rune.striking == this.strikingRune)[0].price;
            }
            this.propertyRunes.forEach(rune => {
                price += itemsService.get_CleanItems().weaponrunes.find(weaponRune => weaponRune.name.toLowerCase() == rune.name.toLowerCase()).price;
            })
        }
        this.aeonStones.forEach(aeonStone => {
            price += itemsService.get_CleanItems().wornitems.find(wornItem => wornItem.name.toLowerCase() == aeonStone.name.toLowerCase()).price;
        })
        return price;
    }
}
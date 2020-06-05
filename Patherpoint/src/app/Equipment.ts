import { ItemGain } from './ItemGain';
import { EffectGain } from './EffectGain';
import { Item } from './Item';
import { ItemActivity } from './ItemActivity';
import { ActivityGain } from './ActivityGain';
import { Rune } from './Rune';
import { ItemsService } from './items.service';
import { InventoryGain } from './InventoryGain';
import { Talisman } from './Talisman';

export class Equipment extends Item {
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Item().save.concat([
        "equipped",
        "gainItems",
        "invested",
        "material",
        "potencyRune",
        "propertyRunes",
        "resilientRune",
        "strikingRune"
    ])
    //Allow changing of "equippable" by custom item creation
    allowEquippable = true;
    //Equipment can normally be equipped.
    equippable = true;
    //Describe all activities that you gain from this item. The activity must be a fully described "Activity" type object
    public activities: ItemActivity[] = [];
    //Some items have a different bulk when you are carrying them instead of wearing them, like backpacks
    public carryingBulk: string = "";
    //Is the item currently equipped - items with equippable==false are always equipped
    public equipped: boolean = false;
    //List EffectGain for every Effect that comes from equipping and investing the item
    //effects get eval'ed, so can use values like "-characterService.get_Character().level"
    public effects: EffectGain[] = [];
    //Amount of propertyRunes you can still apply
    public get freePropertyRunes(): number {
        //You can apply as many property runes as the level of your potency rune. Each rune with the Saggorak trait counts double.
        return this.potencyRune - this.propertyRunes.length - this.propertyRunes.filter(rune => rune.traits.includes("Saggorak")).length;
    };
    //Name any common activity that becomes available when you equip and invest this item
    public gainActivities: ActivityGain[] = [];
    //If this is a container, list whether it has a limit and a bulk reduction.
    public gainInventory: InventoryGain[] = [];
    //List ItemGain for every Item that you receive when you get or equip this item (specified in the ItemGain)
    public gainItems: ItemGain[] = [];
    //What hint should show up for this item? This allows to be more concise and not use the entire description.
    //If no hint is set, desc will show instead
    public hint: string = "";
    //Is the item currently invested - items without the Invested trait are always invested and don't count against the limit
    public invested: boolean = false;
    //Material for weapons, armor and shields
    public material: string = "";
    //What kind of runes and material can be applied to this item? Some items that are not weapons can be modded like weapons, some weapons cannot be modded, etc.
    public moddable: ""|"-"|"weapon"|"armor"|"shield" = "";
    //Potency Rune level for weapons and armor
    public potencyRune:number = 0;
    //Property Rune names for weapons and armor
    public propertyRunes:Rune[] = [];
    //Resilient Rune level for armor
    public resilientRune:number = 0;
    //Is the name input visible in the inventory
    public showName: boolean = false;
    //Striking Rune level for weapons
    public strikingRune:number = 0;
    //Should this item show up on a skill, ability, etc.? If so, name the elements here as a comma separated string
    public showon: string = "";
    //Store any talismans attached to this item.
    public talismans: Talisman[] = [];
    get_Bulk() {
        //Return either the bulk set by an oil, or else the actual bulk of the item.
        let oilBulk: string = "";
        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect
            }
        });
        let bulk = (this.carryingBulk && !this.equipped) ? this.carryingBulk : this.bulk;
        return oilBulk || bulk;
    }
    get_PotencyRune() {
        //Return the highest value of your potency rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.potencyEffect), this.potencyRune);
    }
    get_Potency(potency: number) {
        if (potency > 0) {
            return "+"+potency;
        } else {
            return "";
        }
    }
    get_StrikingRune() {
        //Return the highest value of your striking rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.strikingEffect), this.strikingRune);
    }
    get_Striking(striking: number) {
        switch (striking) {
            case 0:
                return "";
            case 1:
                return "Striking";
            case 2:
                return "Greater Striking";
            case 3:
                return "Major Striking";
        }
    }
    get_ResilientRune() {
        //Return the highest value of your striking rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.resilientEffect), this.resilientRune);
    }
    get_Resilient(resilient: number) {
        switch (resilient) {
            case 0:
                return "";
            case 1:
                return "Resilient";
            case 2:
                return "Greater Resilient";
            case 3:
                return "Major Resilient";
        }
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let potency = this.get_Potency(this.get_PotencyRune());
            let secondary: string = "";
            let properties: string = "";
            if (this.moddable == "weapon") {
                secondary = this.get_Striking(this.get_StrikingRune());
            } else if (this.moddable == "armor") {
                secondary = this.get_Resilient(this.get_ResilientRune());
            }
            this.propertyRunes.forEach(rune => {
                let name: string = rune.name;
                if (rune.name.includes("(Greater)")) {
                    name = "Greater " + rune.name.substr(0, rune.name.indexOf("(Greater)"));
                }
                properties += " " + name;
            })
            return (potency + " " + (secondary + " " + (properties + " " + this.name).trim()).trim()).trim();
        }
    }
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
                price += itemsService.get_CleanItems().weaponrunes.find(weaponRune => weaponRune.name == rune.name).price;
            })
        } else if (this.moddable == "armor") {
            if (this.potencyRune) {
                price += itemsService.get_CleanItems().armorrunes.filter(rune => rune.potency == this.potencyRune)[0].price;
            }
            if (this.strikingRune) {
                price += itemsService.get_CleanItems().armorrunes.filter(rune => rune.resilient == this.strikingRune)[0].price;
            }
            this.propertyRunes.forEach(rune => {
                price += itemsService.get_CleanItems().armorrunes.find(armorRune => armorRune.name == rune.name).price;
            })
        }
        this.talismans.forEach(talisman => {
            price += itemsService.get_CleanItems().talismans.find(cleanTalisman => cleanTalisman.name == talisman.name).price;
        })
        return price;
    }
}
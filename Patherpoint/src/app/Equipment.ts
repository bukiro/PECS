import { ItemGain } from './ItemGain';
import { EffectGain } from './EffectGain';
import { Item } from './Item';
import { ItemActivity } from './ItemActivity';
import { ActivityGain } from './ActivityGain';
import { Rune } from './Rune';
import { ItemsService } from './items.service';

export class Equipment extends Item {
    //Is the name input visible in the inventory
    public showName: boolean = false;
    //If this name is set, always show it instead of the expanded base name
    public displayName: string = "";
    //Some items have a different bulk when you are carrying them instead of wearing them, like backpacks
    public carryingBulk: string = "";
    //Equipment can normally be equipped.
    equippable = true;
    //Allow changing of "equippable" by custom item creation
    allowEquippable = true;
    //Is the item currently equipped - items with equippable==false are always equipped
    public equipped: boolean = false;
    //Is the item currently invested - items without the Invested trait are always invested and don't count against the limit
    public invested: boolean = false;
    //What kind of runes and material can be applied to this item? Some items that are not weapons can be modded like weapons, some weapons cannot be modded, etc.
    public moddable: ""|"weapon"|"armor"|"shield" = "";
    //Potency Rune level for weapons and armor
    public potencyRune:number = 0;
    //Striking Rune level for weapons
    public strikingRune:number = 0;
    //Resilient Rune level for armor
    public resilientRune:number = 0;
    //Property Rune names for weapons and armor
    public propertyRunes:Rune[] = [];
    //Amount of propertyRunes you can still apply
    public get freePropertyRunes(): number {
        //You can apply as many property runes as the level of your potency rune. Each rune with the Saggorak trait counts double.
        return this.potencyRune - this.propertyRunes.length - this.propertyRunes.filter(rune => rune.traits.indexOf("Saggorak") > -1).length;
    };
    //Material for weapons, armor and shields
    public material: string = "";
    //Should this item show up on a skill, ability, etc.? If so, name the elements here as a comma separated string
    public showon: string = "";
    //What hint should show up for this item? This allows to be more concise and not use the entire description.
    //If no hint is set, desc will show instead
    public hint: string = "";
    //Describe all activities that you gain from this item. The activity must be a fully described "Activity" type object
    public activities: ItemActivity[] = [];
    //Name any common activity that becomes available when you equip and invest this item
    public gainActivities: ActivityGain[] = [];
    //List ItemGain for every Item that you receive when you get or equip this item (specified in the ItemGain)
    public gainItems: ItemGain[] = [];
    //List EffectGain for every Effect that comes from equipping and investing the item
    //effects get eval'ed, so can use values like "-characterService.get_Character().level"
    public effects: EffectGain[] = [];
    get_Potency(potency: number) {
        if (potency > 0) {
            return "+"+potency;
        } else {
            return "";
        }
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
            let potency = this.get_Potency(this.potencyRune);
            let secondary: string = "";
            let properties: string = "";
            if (this.moddable == "weapon") {
                secondary = this.get_Striking(this.strikingRune);
            } else if (this.moddable == "armor") {
                secondary = this.get_Resilient(this.resilientRune);
            }
            this.propertyRunes.forEach(rune => {
                let name: string = rune.name;
                if (rune.name.indexOf("(Greater)") > -1) {
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
                price += itemsService.get_Items().weaponrunes.filter(rune => rune.potency == this.potencyRune)[0].price;
            }
            if (this.strikingRune) {
                price += itemsService.get_Items().weaponrunes.filter(rune => rune.striking == this.strikingRune)[0].price;
            }
            this.propertyRunes.forEach(rune => {
                price += itemsService.get_Items().weaponrunes.find(weaponRune => weaponRune.name == rune.name).price;
            })
        } else if (this.moddable == "armor") {
            if (this.potencyRune) {
                price += itemsService.get_Items().armorrunes.filter(rune => rune.potency == this.potencyRune)[0].price;
            }
            if (this.strikingRune) {
                price += itemsService.get_Items().armorrunes.filter(rune => rune.resilient == this.strikingRune)[0].price;
            }
            this.propertyRunes.forEach(rune => {
                price += itemsService.get_Items().armorrunes.find(armorRune => armorRune.name == rune.name).price;
            })
        }
        return price;
    }
}
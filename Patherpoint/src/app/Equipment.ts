import { ItemGain } from './ItemGain';
import { EffectGain } from './EffectGain';
import { Item } from './Item';

export class Equipment extends Item {
    //Is the name input visible in the inventory
    public showName: boolean = false;
    //If this name is set, always show it instead of the expanded base name
    public displayName: string = "";
    //Any notes the player adds to the item
    public notes: string = "";
    //Full description of the item, ideally unchanged from the source material
    public desc: string = "";
    //Is the notes input shown in the inventory
    public showNotes: boolean = false;
    //Some items have a different bulk when you are carrying them instead of wearing them, like backpacks
    public carryingBulk: string = "";
    //Consumables can normally be equipped.
    public equippable: boolean = true;
    //Is the item currently equipped - items with equippable==false are always equipped
    public equipped: boolean = false;
    //Is the item currently invested - items without the Invested trait are always invested and don't count against the limit
    public invested: boolean = false;
    //What kind of runes and material can be applied to this item? Some items that are not weapons can be modded like weapons, some weapons cannot be modded, etc.
    public moddable: ""|"weapon"|"armor"|"shield" = "";
    //What traits does the item have? Can be expanded under certain circumstances
    public traits: string[] = [];
    //Potency Rune level for weapons and armor
    public potencyRune:number = 0;
    //Striking Rune level for weapons
    public strikingRune:number = 0;
    //Resilient Rune level for armor
    public resilientRune:number = 0;
    //Property Rune names for weapons and armor
    public propertyRunes:string[] = [];
    //Material for weapons, armor and shields
    public material: string = "";
    //Should this item show up on a skill, ability, etc.? If so, name the elements here as a comma separated string
    public showon: string = "";
    //What hint should show up for this item? This allows to be more concise and not use the entire description.
    //If no hint is set, desc will show instead
    public hint: string = "";
    //Name any activity that becomes available when you equip and invest this item
    public gainActivity: string[] = [];
    //List ItemGain for every Item that you receive when you get or equip this item (specified in the ItemGain)
    public gainItems: ItemGain[] = [];
    //List EffectGain for every Effect that comes from equipping and investing the item
    public effects: EffectGain[] = [];
    //List EffectGain for every variable Effect that comes from equipping and investing the item
    //specialEffects get eval'ed, so can use values like "-characterService.get_Character().level"
    public specialEffects: EffectGain[] = [];
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
            if (this.moddable == "weapon") {
                secondary = this.get_Striking(this.strikingRune);
            } else if (this.moddable == "armor") {
                secondary = this.get_Resilient(this.resilientRune);
            }
            return (potency + " " + (secondary + " " + this.name).trim()).trim();
        }
    }
}
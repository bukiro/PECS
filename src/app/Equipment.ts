import { EffectGain } from './EffectGain';
import { Item } from './Item';
import { ItemActivity } from './ItemActivity';
import { ActivityGain } from './ActivityGain';
import { Rune } from './Rune';
import { ItemsService } from './items.service';
import { InventoryGain } from './InventoryGain';
import { Talisman } from './Talisman';
import { Material } from './Material';
import { Hint } from './Hint';
import { ConditionGain } from './ConditionGain';
import { SpellChoice } from './SpellChoice';
import { WornItem } from './WornItem';
import { TypeService } from './type.service';
import { SpellGain } from './SpellGain';

export class Equipment extends Item {
    //Allow changing of "equippable" by custom item creation
    allowEquippable = true;
    //Equipment can normally be equipped.
    equippable = true;
    //Describe all activities that you gain from this item. The activity must be a fully described "Activity" type object
    public activities: ItemActivity[] = [];
    public broken: boolean = false;
    public shoddy: boolean = false;
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
        let runes = this.potencyRune - this.propertyRunes.length - this.propertyRunes.filter(rune => rune.traits.includes("Saggorak")).length;
        //Material can allow you to have four runes instead of three.
        let extraRune = this.material?.[0]?.extraRune || 0;
        if (this.potencyRune == 3 && extraRune) {
            for (let index = 0; index < extraRune; index++) {
                runes++;
            }
        }
        return runes;
    };
    //Name any common activity that becomes available when you equip and invest this item
    public gainActivities: ActivityGain[] = [];
    //If this is a container, list whether it has a limit and a bulk reduction.
    public gainInventory: InventoryGain[] = [];
    //These conditions are applied whenever the item is equipped or invested respectively. They should be used sparingly.
    public gainConditions: ConditionGain[] = [];
    //Equipment can allow you to cast a spell as an innate spell. These are listed in gainSpells, and are always innate and always locked, with no choices available.
    public gainSpells: SpellChoice[] = [];
    //What hint should show up for this item? This allows to be more concise and not use the entire description.
    //If no hint is set, desc will show instead
    public hints: Hint[] = [];
    //Is the item currently invested - items without the Invested trait are always invested and don't count against the limit
    public invested: boolean = false;
    public material: Material[] = [];
    //Can runes and material be applied to this item? Armor, shields, weapons and handwraps of mighty blows can usually be modded, but other equipment and specific magic versions of them should not.
    public moddable: boolean = false;
    //Potency Rune level for weapons and armor
    public potencyRune: number = 0;
    //Property Runes for weapons and armor
    public propertyRunes: Rune[] = [];
    //Blade Ally Runes can be emulated on weapons and handwraps
    public bladeAllyRunes: Rune[] = [];
    //Resilient Rune level for armor
    public resilientRune: number = 0;
    //Is the name input visible in the inventory
    public showName: boolean = false;
    //Striking Rune level for weapons
    public strikingRune: number = 0;
    //Store any talismans attached to this item.
    public talismans: Talisman[] = [];
    //List any Talisman Cords attached to this item.
    public talismanCords: WornItem[] = [];
    recast(typeService: TypeService) {
        super.recast(typeService);
        this.activities = this.activities.map(obj => Object.assign(new ItemActivity(), obj).recast());
        this.activities.forEach(activity => { activity.source = this.id });
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainActivities = this.gainActivities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.gainActivities.forEach(gain => { gain.source = this.id });
        this.gainInventory = this.gainInventory.map(obj => Object.assign(new InventoryGain(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainSpells = this.gainSpells.map(obj => Object.assign(new SpellChoice(), obj).recast());
        this.gainSpells.forEach((choice: SpellChoice) => {
            choice.castingType = "Innate";
            choice.source = this.name;
            choice.available = 0;
            choice.spells.forEach((gain: SpellGain) => {
                gain.locked = true;
                gain.sourceId = choice.id;
            })
        })
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.material = this.material.map(obj => Object.assign(new Material(), obj).recast());
        this.propertyRunes = this.propertyRunes.map(obj => Object.assign(new Rune(), obj).recast(typeService));
        this.bladeAllyRunes = this.bladeAllyRunes.map(obj => Object.assign(new Rune(), obj).recast(typeService));
        this.talismans = this.talismans.map(obj => Object.assign(new Talisman(), obj).recast(typeService));
        //Talisman Cords need to be cast blindly to avoid circular dependency warnings.
        this.talismanCords = this.talismanCords.map(obj => typeService.classCast(obj, "WornItem").recast(typeService));
        return this;
    }
    can_Stack() {
        //Additionally to the usual considerations, equipment can't stack if it adds an inventory or any activities.
        return (
            super.can_Stack() &&
            !this.gainInventory.length &&
            !this.activities.some((activity: ItemActivity) => !activity.displayOnly)
        )
    }
    get_Bulk() {
        //Return either the bulk set by an oil, or the bulk of the item, possibly reduced by the material.
        let bulk: string = this.bulk;
        this.material.forEach(material => {
            if (parseInt(this.bulk) && parseInt(this.bulk) != 0) {
                bulk = (parseInt(this.bulk) + material.bulkModifier).toString();
                if (parseInt(bulk) == 0 && parseInt(this.bulk) != 0) {
                    //Material can't reduce the bulk to 0.
                    bulk = "L";
                }
            }
        })
        let oilBulk: string = "";
        this.oilsApplied.forEach(oil => {
            if (oil.bulkEffect) {
                oilBulk = oil.bulkEffect
            }
        });
        bulk = (this.carryingBulk && !this.equipped) ? this.carryingBulk : bulk;
        return oilBulk || bulk;
    }
    get_PotencyRune() {
        //Return the highest value of your potency rune or any oils that emulate one
        return Math.max(...this.oilsApplied.map(oil => oil.potencyEffect), this.potencyRune);
    }
    get_Potency(potency: number) {
        if (potency > 0) {
            return "+" + potency;
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
        //Return the highest value of your resilient rune or any oils that emulate one
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
            let words: string[] = [];
            let potency = this.get_Potency(this.get_PotencyRune());
            if (potency) {
                words.push(potency);
            }
            let secondary: string = "";
            let properties: string[] = [];
            if (this.type == "weapons" || this["isHandwrapsOfMightyBlows"]) {
                secondary = this.get_Striking(this.get_StrikingRune());
            } else if (this.type == "armors") {
                secondary = this.get_Resilient(this.get_ResilientRune());
            }
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
            this.material.forEach(mat => {
                words.push(mat.get_Name());
            })
            //If you have any material in the name of the item, and it has a material applied, remove the original material. This list may grow.
            let materials = [
                "Wooden ",
                "Steel "
            ]
            if (this.material.length && materials.some(mat => this.name.toLowerCase().includes(mat.toLowerCase()))) {
                let name = this.name;
                materials.forEach(mat => {
                    name = name.replace(mat, "");
                })
                words.push(name);
            } else {
                words.push(this.name)
            }
            return words.join(" ");
        }
    }
    get_Price(itemsService: ItemsService) {
        return this.price;
    }
}
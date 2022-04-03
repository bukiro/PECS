import { CharacterService } from "../services/character.service";
import { ItemsService } from "../services/items.service";
import { Armor } from "./Armor";
import { Creature } from "./Creature";
import { Item } from "./Item";
import { Rune } from "./Rune";
import { Shield } from "./Shield";
import { Weapon } from "./Weapon";

export class ItemGain {
    //Amount only applies to stackable items; other items are always granted as one item.
    public amount: number = 1;
    //Only for on==rest: Gain this amount per level additionally to the amount.
    public amountPerLevel: number = 0;
    public expiration: number = 0;
    public expiresOnlyIf: "" | "equipped" | "unequipped" = "";
    //The id is copied from the item after granting it, so that it can be removed again.
    public grantedItemID: string = "";
    //If unhideAfterGrant is set, the item is no longer hidden after it has been granted.
    // This will allow it to be moved and dropped even if it is a type of item that is only granted by another item or by a condition.
    public unhideAfterGrant: boolean = false;
    public name: string = "";
    //An ItemGain with a special property will determine the item to grant with a hardcoded method.
    public special: "Favored Weapon" | "" = "";
    //These runes will be applied to the granted item. They can be { name: name } objects and will be filled during item initialization.
    public newPropertyRunes: Partial<Rune>[] = [];
    public id: string = "";
    //The 'on' property is ignored for activities.
    public on: "" | "grant" | "equip" | "use" | "rest" = "grant";
    public type: string = "weapons";
    //Spells choose from multiple item gains those that match their level.
    //For example, if a spell has an ItemGain with heightenedFilter 1 and one with heightenedFilter 2, and the spell is cast at 2nd level, only the heightenedFilter 2 ItemGain is used.
    public heightenedFilter: number = 0;
    //For conditions that grant an item only on a certain choice, set conditionChoiceFilter.
    public conditionChoiceFilter: string[] = [];
    public recast(): ItemGain {
        return this;
    }
    public get_IsMatchingItem(item: Item): boolean {
        if (this.special) {
            switch (this.special) {
                case "Favored Weapon":
                    //Granting and dropping special: Favored Weapon is handled in the other functions. There should never be a need to match it again here.
                    return false;
            }
        } else if (this.id) {
            return item.refId == this.id;
        } else if (this.name) {
            return item.name.toLowerCase() == this.name.toLowerCase()
        }
    }
    public get_IsMatchingExistingItem(item: Item): boolean {
        if (this.grantedItemID.includes(',')) {
            return (this.grantedItemID.split(',').includes(item.id)) || (item.can_Stack() && this.get_IsMatchingItem(item));
        } else {
            return (item.id == this.grantedItemID) || (item.can_Stack() && this.get_IsMatchingItem(item));
        }
    }
    public grant_GrantedItem(creature: Creature, context: { sourceName?: string, grantingItem?: Item } = {}, services: { characterService: CharacterService, itemsService: ItemsService }): void {
        if (this.special) {
            switch (this.special) {
                case "Favored Weapon":
                    const character = services.characterService.get_Character();
                    const deities = services.characterService.get_CharacterDeities(character);
                    if (deities.length) {
                        const favoredWeaponNames: string[] = [].concat(...deities.map(deity => deity.favoredWeapon));
                        if (favoredWeaponNames.length) {
                            const favoredWeapons: Weapon[] = services.itemsService.get_CleanItems().weapons.filter(weapon => favoredWeaponNames.includes(weapon.name));
                            if (favoredWeapons.length) {
                                let grantedItemIDs: string[] = [];
                                favoredWeapons.forEach(weapon => {
                                    const newGain = Object.assign(new ItemGain(), { ...JSON.parse(JSON.stringify(this)), special: "", id: weapon.id });
                                    newGain.grant_GrantedItem(creature, context, services);
                                    grantedItemIDs.push(newGain.grantedItemID)
                                });
                                this.grantedItemID = grantedItemIDs.join(',');
                            } else {
                                services.characterService.toastService.show("You did not gain your deity's favored weapon because it could not be found.");
                            }
                        } else {
                            services.characterService.toastService.show("You did not gain your deity's favored weapon because your deity has no favored weapon.");
                        }
                    } else {
                        services.characterService.toastService.show("You did not gain your deity's favored weapon because you have no deity.");
                    }
                    break;
            }
        }
        else {
            const newItem: Item = services.itemsService.get_CleanItems()[this.type.toLowerCase()].find((item: Item) => this.get_IsMatchingItem(item));
            if (newItem) {
                if (newItem.can_Stack()) {
                    //For stackables, add the appropriate amount and don't track them.
                    const grantedItem = services.characterService.grant_InventoryItem(newItem, { creature, inventory: creature.inventories[0], amount: (this.amount + (this.amountPerLevel * creature.level)) }, { resetRunes: false, changeAfter: false, equipAfter: false, expiration: this.expiration });
                    if (this.unhideAfterGrant) {
                        grantedItem.hide = false;
                    }
                } else {
                    //For non-stackables, track the ID of the newly added item for removal.
                    //Don't equip the new item if it's a shield or armor and the granting one is too - only one shield or armor can be equipped.
                    let equip = true;
                    if (context.grantingItem && ((newItem instanceof Armor || newItem instanceof Shield) && newItem instanceof context.grantingItem.constructor)) {
                        equip = false;
                    }
                    const grantedItem = services.characterService.grant_InventoryItem(newItem, { creature, inventory: creature.inventories[0], amount: 1 }, { resetRunes: false, changeAfter: false, equipAfter: equip, expiration: this.expiration, newPropertyRunes: this.newPropertyRunes });
                    this.grantedItemID = grantedItem.id;
                    grantedItem.expiresOnlyIf = this.expiresOnlyIf;
                    if (this.unhideAfterGrant) {
                        grantedItem.hide = false;
                    }
                    if (!grantedItem.can_Stack() && context.sourceName) {
                        grantedItem.grantedBy = "(Granted by " + context.sourceName + ")";
                    };
                }
            } else {
                if (this.name) {
                    services.characterService.toastService.show("Failed granting " + this.type.toLowerCase() + " item " + this.name + " - item not found.")
                } else {
                    services.characterService.toastService.show("Failed granting " + this.type.toLowerCase() + " item with id " + (this.id || 0) + " - item not found.")
                }
            }
        }
    }
    public drop_GrantedItem(creature: Creature, options: { requireGrantedItemID?: boolean }, services: { characterService: CharacterService }): void {
        options = Object.assign(
            {
                requireGrantedItemID: true
            }, options
        );
        let done = false;
        let amount = this.amount;
        if (this.special) {
            switch (this.special) {
                case "Favored Weapon":
                    const grantedItemIDs: string[] = this.grantedItemID.split(',');
                    grantedItemIDs.forEach(id => {
                        const newGain = Object.assign(new ItemGain(), { ...JSON.parse(JSON.stringify(this)), special: "", id: "", name: "", grantedItemID: id });
                        newGain.drop_GrantedItem(creature, { requireGrantedItemID: true }, services);
                    });
                    this.grantedItemID = "";
                    break;
            }
        } else {
            creature.inventories.forEach(inv => {
                if (!done) {
                    inv[this.type].filter((item: Item) => options.requireGrantedItemID ? this.get_IsMatchingExistingItem(item) : this.get_IsMatchingItem(item)).forEach((item: Item) => {
                        if (!done) {
                            let amountToRemove = Math.min(amount, item.amount);
                            amount -= amountToRemove;
                            services.characterService.drop_InventoryItem(creature, inv, item, false, true, true, amountToRemove, true);
                            if (amount <= 0) {
                                done = true;
                            }
                        }
                    });
                }
            })
            this.grantedItemID = "";
        }
    }
}

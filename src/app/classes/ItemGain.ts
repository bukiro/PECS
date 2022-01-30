import { CharacterService } from "../services/character.service";
import { ItemsService } from "../services/items.service";
import { Armor } from "./Armor";
import { Creature } from "./Creature";
import { Item } from "./Item";
import { Shield } from "./Shield";

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
    // This will allow it to be moved and dropped even if it is a type of Item that is only granted by another item or by a condition.
    public unhideAfterGrant: boolean = false;
    public name: string = "";
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
        if (this.id) {
            return item.refId == this.id;
        } else if (this.name) {
            return item.name.toLowerCase() == this.name.toLowerCase()
        }
    }
    public get_IsMatchingExistingItem(item: Item): boolean {
        return (item.id == this.grantedItemID) || (item.can_Stack() && this.get_IsMatchingItem(item));
    }
    public grant_GrantedItem(creature: Creature, context: { sourceName?: string, grantingItem?: Item } = {}, services: { characterService: CharacterService, itemsService: ItemsService }): void {
        const newItem: Item = services.itemsService.get_CleanItems()[this.type.toLowerCase()].find((item: Item) => this.get_IsMatchingItem(item));
        if (newItem) {
            if (newItem.can_Stack()) {
                //For stackables, add the appropriate amount and don't track them.
                services.characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, false, false, false, (this.amount + (this.amountPerLevel * creature.level)), undefined, this.expiration);
            } else {
                //For non-stackables, track the ID of the newly added item for removal.
                //Don't equip the new item if it's a shield or armor and the granting one is too - only one shield or armor can be equipped.
                let equip = true;
                if (context.grantingItem && ((newItem instanceof Armor || newItem instanceof Shield) && newItem instanceof context.grantingItem.constructor)) {
                    equip = false;
                }
                const grantedItem = services.characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, false, false, equip, 1, undefined, this.expiration);

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
    public drop_GrantedItem(creature: Creature, options: { requireGrantedItemID?: boolean }, services: { characterService: CharacterService }): void {
        options = Object.assign(
            {
                requireGrantedItemID: true
            }, options
        )
        let done = false;
        let amount = this.amount;
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
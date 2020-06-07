import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { ConditionGain } from '../ConditionGain';
import { Effect } from '../Effect';
import { Consumable } from '../Consumable';
import { Equipment } from '../Equipment';
import { SortByPipe } from '../sortBy.pipe';
import { OtherItem } from '../OtherItem';
import { Item } from '../Item';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Bulk } from '../Bulk';
import { ItemCollection } from '../ItemCollection';
import { WornItem } from '../WornItem';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

    @Input()
    creature: string = "Character";
    private id: number = 0;
    private showItem: number = 0;
    public hover: number = 0;
    public targetInventory = null;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public itemsService: ItemsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
        private timeService: TimeService,
        public sortByPipe: SortByPipe
    ) { }
    minimize() {
        this.characterService.get_Character().settings.inventoryMinimized = !this.characterService.get_Character().settings.inventoryMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature + "-inventory");
        })
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    set_ItemsMenuTarget(target: string) {
        this.characterService.set_ItemsMenuTarget(target);
    }

    toggleMenu(menu: string = "") {
        this.characterService.toggleMenu(menu);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Accent() {
        return this.characterService.get_Accent();
    }

    toggleItem(id: number) {
        if (this.showItem == id) {
            this.showItem = 0;
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Character | AnimalCompanion;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }
    
    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Creatures() {
        return this.characterService.get_Creatures();
    }

    get_Inventories(creature: string = this.creature, newID: boolean = false, calculate: boolean = false) {
        if (newID) {
            this.id = 0;
        }
        if (calculate) {
            let speedRune: boolean = false;
            let enfeebledRune: boolean = false;
            this.get_Creature().inventories.forEach(inventory => {
                inventory.allEquipment().forEach(item => {
                    item.propertyRunes.forEach(rune => {
                        if (rune.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (rune["alignmentPenalty"]) {
                            if (this.characterService.get_Character().alignment.includes(rune["alignmentPenalty"])) {
                                enfeebledRune = true;
                            }
                        }
                    });
                    item.oilsApplied.forEach(oil => {
                        if (oil.runeEffect && oil.runeEffect.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (oil.runeEffect && oil.runeEffect.alignmentPenalty) {
                            if (this.characterService.get_Character().alignment.includes(oil.runeEffect.alignmentPenalty)) {
                                enfeebledRune = true;
                            }
                        }
                    });
                });
            })
            if (speedRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Quickened", "Speed Rune").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Quickened", value: 0, source: "Speed Rune", apply: true }), true)
            } else if (!speedRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Quickened", "Speed Rune").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Quickened", value: 0, source: "Speed Rune", apply: true }), true)
            }
            if (enfeebledRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Enfeebled", "Alignment Rune").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Enfeebled", value: 2, source: "Alignment Rune", apply: true }), true)
            } else if (!enfeebledRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Enfeebled", "Alignment Rune").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Enfeebled", value: 2, source: "Alignment Rune", apply: true }), true)
            }
        }
        return this.get_Creature(creature).inventories;
    }

    get_TargetInventories(item: Item) {
        //Return your inventories and your companion's main inventory (or the character's if called by the companion)
        switch (this.creature) {
            case "Character":
                if (this.characterService.get_CompanionAvailable()) {
                    return [this.get_Creature("Companion").inventories[0]].concat(...this.get_Creature().inventories);
                } else {
                    return this.get_Creature().inventories;
                }
            case "Companion":
                return [this.get_Creature("Character").inventories[0]].concat(...this.get_Creature().inventories);
        }
    }

    get_ContainedItems(item: Item) {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        //Return a number
        if (item.id && item["gainInventory"] && item["gainInventory"].length && this.get_Creature().inventories.length > 1) {
            return this.get_Creature().inventories
                .filter(inventory =>
                    inventory.itemId == item.id
                ).map(inventory => inventory.allItems()
                    .map(item => item.amount)
                    .reduce((a, b) => a + b, 0)
                ).reduce((a, b) => a + b, 0);
        } else {
            return 0
        }
    }

    can_Fit(item: Item, targetInventory: ItemCollection, sourceInventory: ItemCollection) {
        if (targetInventory.itemId == item.id || targetInventory === sourceInventory) {
            return false;
        } else if (targetInventory.bulkLimit) {
            let itemBulk = 0;
            switch (item.get_Bulk()) {
                case "":
                    break;
                case "-":
                    break;
                case "L":
                    if (item.amount) {
                        itemBulk += 0.1 * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1));
                    } else {
                        itemBulk += 0.1;
                    }
                    break;
                default:
                    if (item.amount) {
                        itemBulk += parseInt(item.get_Bulk()) * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1));
                    } else {
                        itemBulk += parseInt(item.get_Bulk());
                    }
                    break;
            }
            return (targetInventory.get_Bulk(false) + itemBulk <= targetInventory.bulkLimit)
        } else {
            return true;
        }
    }

    sort_Cash() {
        this.characterService.sort_Cash();
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    sort_ItemSet(itemSet) {
        return this.sortByPipe.transform(itemSet, "asc", "name");
    }

    can_Equip(item: Item, inventoryIndex: number) {
        return (inventoryIndex == 0 && item.equippable && this.creature == "Character" && !item.traits.includes("Companion")) || (item.traits.includes("Companion") && this.creature == "Companion") || item.name == "Unarmored"
    }

    can_Invest(item: Item, inventoryIndex: number) {
        return inventoryIndex == 0 && item.can_Invest() && ((this.creature == "Character" && !item.traits.includes("Companion")) || (item.traits.includes("Companion") && this.creature == "Companion"))
    }

    can_Drop(item: Item) {
        //Hidden items are never bought from the store. This implies that you gained them via an activity, spell, etc. and should not drop it.
        //For Companions, the same goes for their basic attacks;
        return !item.hide
    }

    drop_InventoryItem(item: Item, inventory: ItemCollection, pay: boolean = false) {
        this.showItem = 0;
        if (pay) {
            if (this.get_Price(item)) {
                let price = this.get_Price(item);
                if (item["stack"]) {
                    price *= Math.floor(item.amount / item["stack"]);
                } else {
                    price *= item.amount;
                }
                if (price) {
                    this.change_Cash(1, Math.floor(price / 2));
                }
            }
        }
        this.characterService.drop_InventoryItem(this.get_Creature(), inventory, item, true, true, true, item.amount);
    }

    move_InventoryItem(item: Item, inventory: ItemCollection, changeafter: boolean = true) {
        if (this.targetInventory && this.targetInventory != inventory) {
            let fromCreature = this.get_Creatures().find(creature => creature.inventories.find(inv => inv === inventory)) as Character | AnimalCompanion;
            let toCreature = this.get_Creatures().find(creature => creature.inventories.find(inv => inv === this.targetInventory)) as Character | AnimalCompanion;
            if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length && fromCreature == toCreature) {
                let movedItem = JSON.parse(JSON.stringify(item));
                movedItem = this.characterService.reassign(movedItem);
                this.targetInventory[item.type].push(movedItem);
                inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item)
                if ((movedItem as Equipment).equipped) {
                    this.on_Equip(movedItem as Equipment, inventory, false)
                }
                if ((movedItem as Equipment).invested) {
                    this.on_Invest(movedItem as Equipment, inventory, false)
                }
            } else {
                let movedItem = JSON.parse(JSON.stringify(item));
                let movedInventories: ItemCollection[]
                //If this item is a container and is moved between creature, the attached inventories need to be moved as well.
                //Because we lose the inventory when we drop the item, but automatically gain one when we grant the item to the other creature,
                // we need to first save the inventory, then recreate it and remove the new ones after moving the item.
                //Here, we save the inventories and take care of any containers within the container.
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    //First, move all inventory items within this inventory item to the same target. They get 
                    fromCreature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                        inv.allItems().filter(invItem => (invItem as Equipment).gainInventory && (invItem as Equipment).gainInventory.length).forEach(invItem => {
                            this.move_InventoryItem(invItem, inv, false);
                        });
                    });
                    movedInventories = fromCreature.inventories.filter(inv => inv.itemId == item.id).map(inv => JSON.parse(JSON.stringify(inv)))
                    movedInventories = movedInventories.map(inv => this.characterService.reassign(inv));
                }
                let newItem = this.characterService.grant_InventoryItem(toCreature, this.targetInventory, movedItem, false, false, false, movedItem.amount, false);
                this.characterService.drop_InventoryItem(fromCreature, inventory, item, false, true, true, item.amount);
                //Below, we reinsert the saved inventories and remove any newly created ones.
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    toCreature.inventories = toCreature.inventories.filter(inv => inv.itemId != newItem.id);
                    let newLength = toCreature.inventories.push(...movedInventories);
                    toCreature.inventories.slice(newLength - movedInventories.length, newLength).forEach(inv => {
                        inv.itemId = newItem.id;
                    })
                }
                if ((newItem as Equipment).equipped) {
                    this.on_Equip(newItem as Equipment, this.targetInventory, false)
                }
                if ((newItem as Equipment).invested) {
                    this.on_Invest(newItem as Equipment, this.targetInventory, false)
                }
            }

        }
        if (changeafter) {
            this.targetInventory = null;
            this.characterService.set_Changed();
        }

    }

    drop_ContainerOnly(item: Item, inventory: ItemCollection) {
        this.showItem = 0;
        this.characterService.drop_InventoryItem(this.get_Creature(), inventory, item, true, true, false, item.amount);
    }

    add_NewOtherItem(inventory: ItemCollection) {
        inventory.otheritems.push(new OtherItem());
    }

    bulkOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 76 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    validate_Bulk(item: OtherItem) {
        if (parseInt(item.bulk) || parseInt(item.bulk) == 0 || item.bulk == "L" || item.bulk == "") {

        } else {
            item.bulk = "";
        }
    }

    remove_OtherItem(item: OtherItem, inventory: ItemCollection) {
        inventory.otheritems.splice(inventory.otheritems.indexOf(item), 1);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Duration(turns: number) {
        return this.timeService.get_Duration(turns);
    }

    get_Bulk() {
        let bulk: Bulk = new Bulk();
        bulk.calculate(this.get_Creature(), this.characterService, this.effectsService);
        if (bulk.$current.value > bulk.$encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length == 0) {
            this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
        }
        if (bulk.$current.value <= bulk.$encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length > 0) {
            this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
        }
        return [bulk];
    }

    get_MaxInvested() {
        let maxInvest = 0;
        let effects: Effect[] = [];
        let penalties: boolean = false;
        let bonuses: boolean = false;
        let absolutes: boolean = false;
        let explain: string = ""
        if (this.creature == "Character") {
            maxInvest = 10;
            explain = "Base limit: 10";
        } else if (this.creature == "Companion") {
            maxInvest = 2;
            explain = "Base limit: 2";
        }
        this.effectsService.get_AbsolutesOnThis(this.get_Creature(), "Max Invested").forEach(effect => {
            maxInvest = parseInt(effect.setValue);
            explain = effect.source + ": " + effect.setValue;
            absolutes = true;
            effects.push(effect);
        });
        this.effectsService.get_RelativesOnThis(this.get_Creature(), "Max Invested").forEach(effect => {
            maxInvest += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + effect.value;
            if (parseInt(effect.value) < 0) {
                if (!effect.hide) {
                    penalties = true;
                }
            } else {
                if (!effect.hide) {
                    bonuses = true;
                }
            }
            effects.push(effect);
        });
        return { value: maxInvest, explain: explain, effects: effects, penalties: penalties, bonuses: bonuses, absolutes: absolutes };
    }

    get_InvestedItems() {
        return this.characterService.get_InvestedItems(this.get_Creature());
    }

    get_Invested() {
        //Sum up the invested items: 1 for each item other than Wayfinders,
        //  and for Wayfinders: 1 for the Wayfinder, and 1 for each Aeon Stone but the first. That is represented by 1 for each Aeon Stone (but at least 1).
        return this.get_InvestedItems().map((item: WornItem) =>
            (item.isWayfinder && item.aeonStones) ? Math.max(item.aeonStones.length, 1) : 1
        ).reduce((a, b) => a + b, 0);
    }

    on_Equip(item: Equipment, inventory: ItemCollection, equipped: boolean) {
        this.characterService.onEquip(this.get_Creature(), inventory, item, equipped);
    }

    on_Invest(item: Equipment, inventory: ItemCollection, invested: boolean) {
        this.characterService.onInvest(this.get_Creature(), inventory, item, invested);
    }

    onNameChange() {
        this.characterService.set_Changed(this.creature);
    }

    onAmountChange(item: Consumable, amount: number, pay: boolean = false) {
        item.amount += amount;
        if (pay) {
            if (amount > 0) {
                this.change_Cash(-1, this.get_Price(item));
            } else if (amount < 0) {
                this.change_Cash(1, Math.floor(this.get_Price(item) / 2));
            }
        }
    }

    get_InventoryName(inventory: ItemCollection) {
        return inventory.get_Name(this.characterService);
    }

    on_ConsumableUse(item: Consumable, creature: string, inventory: ItemCollection) {
        this.characterService.on_ConsumableUse(this.get_Creature(creature), item);
        if (this.can_Drop(item) && !item.can_Stack()) {
            this.drop_InventoryItem(item, inventory, false);
        }
    }

    can_ApplyTalismans(item: Item) {
        return (["armors", "shields", "weapons"].includes(item.type)) &&
        (
            (item as Equipment).talismans.length ||
            this.get_Creature().inventories.filter(inv => inv.talismans.length).length
        )
    }

    get_Price(item: Item) {
        if (item["get_Price"]) {
            return item["get_Price"](this.itemsService);
        } else {
            return item.price;
        }
    }

    have_Funds(sum: number = 0) {
        let character = this.characterService.get_Character();
        let funds = (character.cash[0] * 1000) + (character.cash[1] * 100) + (character.cash[2] * 10) + (character.cash[3]);
        if (sum <= funds) {
            return true;
        } else {
            return false;
        }
    }

    change_Cash(multiplier: number = 1, sum: number = 0, changeafter: boolean = false) {
        this.characterService.change_Cash(multiplier, sum);
        if (changeafter) {
            this.characterService.set_Changed();
        }
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["inventory", "all", this.creature].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["inventory", "all"].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }


}

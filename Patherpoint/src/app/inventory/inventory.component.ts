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
import { InventoryGain } from '../InventoryGain';

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
        public sortByPipe: SortByPipe
    ) { }
    minimize() {
        this.characterService.get_Character().settings.inventoryMinimized = !this.characterService.get_Character().settings.inventoryMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-inventory");
        })
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    toggleMenu(menu: string = "") {
        this.characterService.toggleMenu(menu);
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
        return this.characterService.get_Creature(creature) as Character|AnimalCompanion;
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
                });
            })
            if (speedRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Quickened", "Speed Rune").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Quickened", value:0, source:"Speed Rune", apply:true}), true)
            } else if (!speedRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Quickened", "Speed Rune").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Quickened", value:0, source:"Speed Rune", apply:true}), true)
            }
            if (enfeebledRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Enfeebled", "Alignment Rune").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Enfeebled", value:2, source:"Alignment Rune", apply:true}), true)
            } else if (!enfeebledRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Enfeebled", "Alignment Rune").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Enfeebled", value:2, source:"Alignment Rune", apply:true}), true)
            }
        }
        return this.get_Creature(creature).inventories;
    }

    get_TargetInventories() {
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
        //Add up the number of items in each inventory associated by this item
        //Return a number
        if (item.id && item["gainInventory"] && this.get_Creature().inventories.length > 1) {
            return this.get_Creature().inventories.filter(inventory => inventory.itemId == item.id).map(inventory => inventory.allItems().map(item => item.amount).reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
        } else {
            return 0
        }
    }

    can_Fit(item: Item, targetInventory: ItemCollection, sourceInventory: ItemCollection) {
        if (targetInventory.itemId == item.id || targetInventory === sourceInventory) {
            return false;
        } else if (targetInventory.bulkLimit) {
            let itemBulk = 0;
            switch (item["carryingBulk"] || item.bulk) {
                case "":
                    break;
                case "-":
                    break;
                case "L":
                    if (item.amount) {
                        itemBulk += 0.1 * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1)) ;
                    } else {
                        itemBulk += 0.1;
                    }
                    break;
                default:
                    if (item.amount) {
                        itemBulk += parseInt(item.bulk) * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1));
                    } else {
                        itemBulk += parseInt(item.bulk);
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
        return (this.creature == "Character") || (this.creature == "Companion" && item.type != "weapons" && item.name != "Unarmored")
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

    move_InventoryItem(item: Item, inventory: ItemCollection) {
        if (this.targetInventory && this.targetInventory != inventory) {
            let movedItem = JSON.parse(JSON.stringify(item));
            movedItem = this.characterService.reassign(movedItem);
            let newLength = this.targetInventory[item.type].push(movedItem);
            inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item)
            if (movedItem["equipped"]) {
                this.on_Equip(movedItem as Equipment, inventory, false)
            }
            if (movedItem["invested"]) {
                this.on_Invest(movedItem as Equipment, inventory, false)
            }
        }
        this.targetInventory = null;
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

    get_Bulk() {
        let bulk: Bulk = new Bulk();
        bulk.calculate(this.get_Creature(), this.characterService, this.effectsService);
        if (bulk.$current.value > bulk.$encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length == 0) {
            this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Encumbered", value:0, source:"Bulk", apply:true}), true)
        }
        if (bulk.$current.value <= bulk.$encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length > 0) {
            this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Encumbered", value:0, source:"Bulk", apply:true}), true)
        }
        return [bulk];
    }

    get_maxInvested() {
        let maxInvest = 0;
        let effects: Effect[] = [];
        let penalty: boolean = false;
        let bonus: boolean = false;
        let explain: string = ""
        if (this.creature == "Character") {
            maxInvest = 10;
            explain = "Base limit: 10";
        } else if (this.creature == "Companion") {
            maxInvest = 2;
            explain = "Base limit: 2";
        }
        this.effectsService.get_EffectsOnThis(this.get_Creature(), "Max Invested").forEach(effect => {
            maxInvest += parseInt(effect.value);
            if (parseInt(effect.value) < 0) {
                penalty = true;
            } else {
                bonus = true;
            }
            explain += "\n"+effect.source+": "+effect.value;
            effects.push(effect);
        });
        return {value:maxInvest, explain:explain, effects:effects, penalty:penalty, bonus:bonus};
    }

    get_InvestedItems() {
        return this.characterService.get_InvestedItems(this.get_Creature()).filter(item => item.traits.includes("Invested"));
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

    on_ConsumableUse(item: Consumable, inventory: ItemCollection) {
        this.characterService.on_ConsumableUse(this.get_Creature(), item);
        if (this.can_Drop(item) && !item.can_Stack()) {
            this.drop_InventoryItem(item, inventory, false);
        }
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

    get_Actions(item: Consumable) {
        switch (item.actions) {
            case "Free":
                return "(Free Action)";
            case "Reaction":
                return "(Reaction)";
            case "1":
                return "(1 Action)";
            case "2":
                return "(2 Actions)";
            case "3":
                return "(3 Actions)";
            default:
                return "("+item.actions+")";
        }
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "inventory" || target == "all" || target == this.creature) {
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

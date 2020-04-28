import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

    private id: number = 0;
    private showItem: number = 0;
    public hover: number = 0;
    
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
            document.getElementById("inventory").style.gridRow = "span "+this.characterService.get_Span("inventory-height");
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

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_InventoryItems(newID: boolean = false) {
        if (newID) {
            this.id = 0;
        }
        let speedRune: boolean = false;
        let enfeebledRune: boolean = false;
        this.characterService.get_InventoryItems().allEquipment().forEach(item => {
            item.propertyRunes.forEach(rune => {
                if (rune.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                    speedRune = true;
                }
                
                if (rune["alignmentPenalty"]) {
                    if (this.characterService.get_Character().alignment.indexOf(rune["alignmentPenalty"]) > -1) {
                        enfeebledRune = true;
                    }
                }
            })
        })
        if (speedRune && this.characterService.get_AppliedConditions("Quickened", "Speed Rune").length == 0) {
            this.characterService.add_Condition(Object.assign(new ConditionGain, {name:"Quickened", value:0, source:"Speed Rune", apply:true}), true)
        } else if (!speedRune && this.characterService.get_AppliedConditions("Quickened", "Speed Rune").length > 0) {
            this.characterService.remove_Condition(Object.assign(new ConditionGain, {name:"Quickened", value:0, source:"Speed Rune", apply:true}), true)
        }
        if (enfeebledRune && this.characterService.get_AppliedConditions("Enfeebled", "Alignment Rune").length == 0) {
            this.characterService.add_Condition(Object.assign(new ConditionGain, {name:"Enfeebled", value:2, source:"Alignment Rune", apply:true}), true)
        } else if (!enfeebledRune && this.characterService.get_AppliedConditions("Enfeebled", "Alignment Rune").length > 0) {
            this.characterService.remove_Condition(Object.assign(new ConditionGain, {name:"Enfeebled", value:2, source:"Alignment Rune", apply:true}), true)
        }
        return this.characterService.get_InventoryItems();
    }
    
    sort_ItemSet(itemSet) {
        return this.sortByPipe.transform(itemSet, "asc", "name");
    }

    drop_InventoryItem(item, pay: boolean = false) {
        this.showItem = 0;
        if (pay) {
            if (this.get_Price(item)) {
                let price = this.get_Price(item);
                if (item.stack) {
                    price *= Math.floor(item.amount / item.stack);
                } else {
                    price *= item.amount;
                }
                if (price) {
                    this.change_Cash(1, Math.floor(price / 2));
                }
            }
        }
        this.characterService.drop_InventoryItem(item, true, true, true, item.amount);
    }

    drop_Package(item) {
        this.showItem = 0;
        this.characterService.drop_InventoryItem(item, true, true, false, item.amount);
    }

    add_NewOtherItem() {
        this.get_InventoryItems().otheritems.push(new OtherItem());
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

    remove_OtherItem(item: OtherItem) {
        this.get_InventoryItems().otheritems.splice(this.get_InventoryItems().otheritems.indexOf(item), 1);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Bulk() {
        let bulk = this.characterService.get_Character().bulk;
        bulk.calculate(this.characterService, this.effectsService);
        if (bulk.$current > bulk.$encumbered.value && this.characterService.get_AppliedConditions("Encumbered", "Bulk").length == 0) {
            this.characterService.add_Condition(Object.assign(new ConditionGain, {name:"Encumbered", value:0, source:"Bulk", apply:true}), true)
        }
        if (bulk.$current <= bulk.$encumbered.value && this.characterService.get_AppliedConditions("Encumbered", "Bulk").length > 0) {
            this.characterService.remove_Condition(Object.assign(new ConditionGain, {name:"Encumbered", value:0, source:"Bulk", apply:true}), true)
        }
        return [bulk];
    }

    get_maxInvested() {
        let maxInvest = 10;
        let effects: Effect[] = [];
        let penalty: boolean = false;
        let bonus: boolean = false;
        let explain: string = "Base limit: 10"
        this.effectsService.get_EffectsOnThis("Max Invested").forEach(effect => {
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
        return this.characterService.get_InvestedItems().filter(item => item.traits.indexOf("Invested") > -1);
    }

    onEquip(item: Equipment, equipped: boolean) {
        this.characterService.onEquip(item, equipped);
    }

    onInvest(item: Equipment, invested: boolean) {
        this.characterService.onInvest(item, invested);
    }

    onNameChange() {
        this.characterService.set_Changed();
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

    on_ConsumableUse(item: Consumable) {
        this.characterService.on_ConsumableUse(item);
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

    get_Actions(item) {
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
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }


}

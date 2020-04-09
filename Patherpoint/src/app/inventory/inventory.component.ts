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

    get_Accent(hover: number = -1) {
        return this.characterService.get_Accent((hover == this.hover));
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
            item.propertyRunes.filter(rune => rune != "" && rune.substr(0,6) != "Locked").forEach(rune => {
                if (rune == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                    speedRune = true;
                }
                let exampleRune = this.characterService.get_Items().weaponrunes.filter(weaponrune => weaponrune.name == rune);
                if (exampleRune.length && exampleRune[0].alignmentPenalty) {
                    if (this.characterService.get_Character().alignment.indexOf(exampleRune[0].alignmentPenalty) > -1) {
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

    drop_InventoryItem(item) {
        this.showItem = 0;
        this.characterService.drop_InventoryItem(item);
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

    onAmountChange(item: Consumable, amount: number) {
        if (amount > 0) {
            this.characterService.grant_InventoryItem(item, false, false, false, amount)
        } else if (amount < 0) {
            item.amount += amount;
        }
    }

    on_ConsumableUse(item: Consumable) {
        this.characterService.on_ConsumableUse(item);
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

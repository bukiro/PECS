import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { ConditionGain } from '../ConditionGain';
import { Effect } from '../Effect';
import { Item } from '../Item';
import { Consumable } from '../Consumable';

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
        public effectsService: EffectsService
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

    get_InventoryItems() {
        this.id = 0;
        return this.characterService.get_InventoryItems();
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

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    get_ConditionsShowingOn(skillName: string) {
        return this.characterService.get_ConditionsShowingOn(skillName);
    }

    can_Invest(item) {
        return (item.traits.indexOf("Invested") > -1);
    }

    get_EffectsOnThis(name: string) {
        return this.effectsService.get_EffectsOnThis(name)
    }

    get_maxInvested() {
        let maxInvest = 10;
        let effects: Effect[] = [];
        let penalty: boolean = false;
        let bonus: boolean = false;
        let explain: string = "Base limit: 10"
        this.get_EffectsOnThis("Max Invested").forEach(effect => {
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

    onEquip(item: Item, equipped: boolean) {
        this.characterService.onEquip(item, equipped);
    }

    onInvest(item: Item, invested: boolean) {
        this.characterService.onInvest(item, invested);
    }

    onNameChange() {
        this.characterService.set_Changed();
    }

    onAmountChange(item: Consumable, amount: number) {
        if (amount > 0) {
            this.characterService.grant_InventoryItem(item, false, false, amount)
        } else if (amount < 0) {
            item.amount += amount;
        }
    }

    get_MaxRune(weapon: Weapon|Armor) {
        switch (weapon.potencyRune) {
            case 1:
                return [0,1];
                break;
            case 2:
                return [0,1,2];
                break;
            case 3:
                return [0,1,2,3];
                break;
            default:
                return [0];
        }
    }

    onWeaponRuneChange(weapon: Weapon) {
        //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.
        weapon.potencyRune = parseInt(weapon.potencyRune.toString());
        weapon.strikingRune = parseInt(weapon.strikingRune.toString());
        this.characterService.set_Changed();
    }
    
    onArmorRuneChange(armor: Armor) {
        //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.
        armor.potencyRune = parseInt(armor.potencyRune.toString());
        armor.resilientRune = parseInt(armor.resilientRune.toString());
        this.characterService.set_Changed();
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

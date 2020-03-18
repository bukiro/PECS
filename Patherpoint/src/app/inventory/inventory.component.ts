import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { ConditionGain } from '../ConditionGain';
import { Effect } from '../Effect';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public itemsService: ItemsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService
    ) { }

    still_loading() {
        return this.characterService.still_loading();
    }

    toggleMenu(menu: string = "") {
        this.characterService.toggleMenu(menu);
    }

    get_InventoryItems(type: string) {
        switch (type) {
            case "Weapons":
                return this.characterService.get_InventoryItems().weapons;
            case "Armor":
                return this.characterService.get_InventoryItems().armors;
            case "Shields":
                return this.characterService.get_InventoryItems().shields;
            case "Worn Items":
                return this.characterService.get_InventoryItems().wornitems;
            case "Alchemical Elixirs":
                return this.characterService.get_InventoryItems().alchemicalelixirs;
        }
    }
    
    drop_InventoryItem(item) {
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

    test(object) {
        return object;
    }

    get_InvestedItems() {
        return this.characterService.get_InvestedItems().filter(item => item.traits.indexOf("Invested") > -1);
    }

    onChange(item) {
        this.characterService.onEquipChange(item);
    }

    onInvest(item) {
        this.characterService.onInvestChange(item);
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

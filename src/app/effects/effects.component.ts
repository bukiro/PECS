import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { TimeService } from '../time.service';
import { TraitsService } from '../traits.service';
import { ConditionGain } from '../ConditionGain';
import { Effect } from '../Effect';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Condition } from '../Condition';
import { Rune } from '../Rune';
import { WeaponRune } from '../WeaponRune';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    public fullDisplay: boolean = false;
    @Input()
    public sheetSide: string = "left";
    public showApplied: boolean = true;
    public showNotApplied: boolean = false;
    public showHidden: boolean = false;
    public showItem: string = "";
    public Math = Math;
    public parseInt = parseInt;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private traitsService: TraitsService,
        private effectsService: EffectsService,
        private characterService: CharacterService,
        private timeService: TimeService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.effectsMinimized = !this.characterService.get_Character().settings.effectsMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.effectsMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
            case "Familiar":
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_Darkmode() {
        return this.characterService.get_Darkmode();
    }

    receive_ItemMessage(name: string) {
        this.toggle_Item(name);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    trackByConditionGainID(index: number, obj: ConditionGain): string {
        return obj.id;
    }

    trackByUniqueEffect(index: number, obj: Effect): string {
        return obj.target + obj.setValue + obj.value + (obj.toggle ? "true" : "false") + (obj.penalty ? "true" : "false") + index.toString();
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    toggle_Applied() {
        this.showApplied = !this.showApplied;
    }

    toggle_NotApplied() {
        this.showNotApplied = !this.showNotApplied;
    }

    toggle_Hidden() {
        this.showHidden = !this.showHidden;
    }

    get_ToggledCount() {
        return ((this.showApplied && 1) + (this.showNotApplied && 1) + (this.showHidden && 1));
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Effects() {
        return this.effectsService.get_Effects(this.creature);
    }

    get_Conditions(name: string = "") {
        return this.characterService.get_Conditions(name);
    }

    get_AppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && effect.show).sort(function (a, b) {
            if (a.value > b.value) {
                return 1;
            }
            if (a.value < b.value) {
                return -1;
            }
            return 0;
        }).sort(function (a, b) {
            if (a.setValue > b.setValue) {
                return 1;
            }
            if (a.setValue < b.setValue) {
                return -1;
            }
            return 0;
        }).sort(function (a, b) {
            if (a.target > b.target) {
                return 1;
            }
            if (a.target < b.target) {
                return -1;
            }
            return 0;
        });
    }

    get_NotAppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && !effect.apply);
    }

    get_HiddenEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && !effect.show);
    }

    get_AppliedConditions(apply: boolean) {
        return this.characterService.get_AppliedConditions(this.get_Creature()).filter(condition => condition.apply == apply).sort(function (a, b) {
            if (a.name + a.value + a.choice > b.name + b.value + b.choice) {
                return 1;
            }
            if (a.name + a.value + a.choice < b.name + b.value + b.choice) {
                return -1;
            }
            return 0;
        });
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    get_IsInformationalCondition(conditionGain: ConditionGain, condition: Condition) {
        return condition.get_IsInformationalCondition(this.get_Creature(), this.characterService, conditionGain);
    }

    on_IgnoreEffect(effect: Effect, ignore: boolean) {
        if (ignore) {
            this.get_Creature().ignoredEffects.push(effect);
        } else {
            this.get_Creature().ignoredEffects = this.get_Creature().ignoredEffects.filter(ignoredEffect =>
                !(
                    ignoredEffect.creature == effect.creature &&
                    ignoredEffect.target == effect.target &&
                    ignoredEffect.source == effect.source
                )
            )
        }
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    calculate_InventoryEffects() {
        let speedRune: boolean = false;
        let enfeebledRune: boolean = false;
        //Conditions caused by equipment are not calculated for Familiars (who don't have an inventory) or in manual mode.
        if (this.creature != "Familiar" && !this.get_ManualMode()) {
            this.get_Creature().inventories.forEach(inventory => {
                inventory.allEquipment().forEach(item => {
                    item.propertyRunes.forEach((rune: Rune) => {
                        if (rune.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (rune instanceof WeaponRune && rune.alignmentPenalty) {
                            if (this.characterService.get_Character().alignment.includes(rune.alignmentPenalty)) {
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
            if (this.get_Creature().inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && (this.characterService.get_AppliedConditions(this.get_Creature(), "Clumsy", "Large Weapon").length == 0)) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Clumsy", value: 1, source: "Large Weapon", apply: true }), true)
            } else if (!this.get_Creature().inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && (this.characterService.get_AppliedConditions(this.get_Creature(), "Clumsy", "Large Weapon").length > 0)) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Clumsy", value: 1, source: "Large Weapon", apply: true }), true)
            }
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
    }

    calculate_Bulk() {
        //Encumbered conditions are not calculated for Familiars (who don't have an inventory) or in manual mode.
        if (this.creature != "Familiar" && !this.get_ManualMode()) {
            let bulk = this.get_Creature().bulk;
            let calculatedBulk = bulk.calculate((this.get_Creature() as Character | AnimalCompanion), this.characterService, this.effectsService);
            if (calculatedBulk.current.value > calculatedBulk.encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
            }
            if (calculatedBulk.current.value <= calculatedBulk.encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
            }
        }
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["effects", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                        this.calculate_InventoryEffects();
                        this.calculate_Bulk();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["effects", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                        this.calculate_InventoryEffects();
                        this.calculate_Bulk();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
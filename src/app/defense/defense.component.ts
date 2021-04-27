import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { DefenseService } from '../defense.service';
import { TraitsService } from '../traits.service';
import { Armor } from '../Armor';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { AbilitiesService } from '../abilities.service';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Talisman } from '../Talisman';
import { Shield } from '../Shield';
import { ConditionGain } from '../ConditionGain';
import { ConditionsService } from '../conditions.service';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../toast.service';

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenseComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    public shieldDamage: number = 0;
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private defenseService: DefenseService,
        private traitsService: TraitsService,
        private conditionsService: ConditionsService,
        public effectsService: EffectsService,
        public abilitiesService: AbilitiesService,
        public toastService: ToastService,
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        //For touch compatibility, this openDelay prevents the popover from closing immediately on tap because a tap counts as hover and then click;
        popoverConfig.openDelay = 1;
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "hover:click";
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 1;
        tooltipConfig.triggers = "hover:click";
    }

    minimize() {
        this.characterService.get_Character().settings.defenseMinimized = !this.characterService.get_Character().settings.defenseMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.defenseMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
            case "Familiar":
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    get_ArmorSpecialization(armor: Armor) {
        return armor.get_ArmorSpecialization(this.get_Creature(), this.characterService);
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_AC() {
        return this.defenseService.get_AC();
    }

    get_CalculatedAC() {
        return this.get_AC().calculate(this.get_Creature(), this.characterService, this.defenseService, this.effectsService);
    }

    get_Cover() {
        let creature = this.get_Creature();
        let conditions: ConditionGain[] = this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .filter(gain => gain.name == "Cover" && gain.source == "Quick Status");
        if (conditions.some(gain => gain.name == "Cover" && gain.choice == "Greater")) {
            return 4;
        }
        if (conditions.some(gain => gain.name == "Cover" && gain.choice == "Standard")) {
            return 2;
        }
        if (conditions.some(gain => gain.name == "Cover" && gain.choice == "Lesser")) {
            return 1;
        }
        return 0;
    }

    set_Cover(cover: number, shield: Shield = null) {
        this.get_AC().set_Cover(this.get_Creature(), cover, shield, this.characterService, this.conditionsService);
    }

    raise_Shield(raised: boolean = false, shield: Shield) {
        if (shield) {
            shield.raised = raised;
            if (!raised && shield.takingCover) {
                this.set_Cover(0, shield);
            }
            this.set_DefenseChanged();
        }
    }

    get_FlatFooted() {
        let creature = this.get_Creature();
        return this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .find(gain => gain.name == "Flat-Footed" && gain.source == "Quick Status");
    }

    set_FlatFooted(active: boolean) {
        let creature = this.get_Creature();
        let flatFooted = this.get_FlatFooted();
        if (active) {
            if (!flatFooted) {
                let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: "Flat-Footed", source: "Quick Status", duration: -1, locked: true })
                this.characterService.add_Condition(creature, newCondition, false);
            }
        } else {
            if (flatFooted) {
                this.characterService.remove_Condition(creature, flatFooted, false);
            }
        }
        this.characterService.process_ToChange();
    }

    get_Hidden() {
        let creature = this.get_Creature();
        return this.conditionsService.get_AppliedConditions(creature, this.characterService, creature.conditions, true)
            .find(gain => gain.name == "Hidden" && gain.source == "Quick Status");
    }

    set_Hidden(active: boolean) {
        let creature = this.get_Creature();
        let hidden = this.get_Hidden();
        if (active) {
            if (!hidden) {
                let newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: "Hidden", source: "Quick Status", duration: -1, locked: true })
                this.characterService.add_Condition(creature, newCondition, false);
            }
        } else {
            if (hidden) {
                this.characterService.remove_Condition(creature, hidden, false);
            }
        }
        this.characterService.process_ToChange();
    }

    get_EquippedArmor() {
        return this.defenseService.get_EquippedArmor(this.get_Creature() as Character | AnimalCompanion);
    }

    get_EquippedShield() {
        return this.defenseService.get_EquippedShield(this.get_Creature() as Character | AnimalCompanion);
    }

    on_ShieldHPChange(shield: Shield, amount: number) {
        shield.damage += amount;
        if (shield.get_HitPoints() < shield.get_BrokenThreshold()) {
            shield.broken = true;
            this.characterService.onEquip(this.get_Creature() as Character | AnimalCompanion, this.get_Creature().inventories[0], shield, false, false, true)
            this.toastService.show("Your shield broke and was unequipped.", [], this.characterService)
        } else {
            shield.broken = false;
        }
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.set_ToChange(this.creature, "defense");
        this.characterService.process_ToChange();
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type)
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_TalismanTitle(talisman: Talisman) {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc;
    }

    on_TalismanUse(item: Armor | Shield, talisman: Talisman, index: number) {
        this.characterService.set_ToChange(this.creature, "defense");
        this.characterService.on_ConsumableUse(this.get_Creature() as Character | AnimalCompanion, talisman);
        item.talismans.splice(index, 1)
        this.characterService.process_ToChange();
    }

    set_DefenseChanged() {
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["defense", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["defense", "all"].includes(view.target.toLowerCase())) {
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

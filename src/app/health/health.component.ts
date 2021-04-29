import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { ConditionGain } from '../ConditionGain';
import { Health } from '../Health';
import { TimeService } from '../time.service';
import { ItemsService } from '../items.service';
import { SpellsService } from '../spells.service';
import { ConditionsService } from '../conditions.service';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    public showMinimizeButton: boolean = true;
    @Input()
    public sheetSide: string = "left";
    
    public showDamageSlider: boolean = false;
    public damageSliderMax: number = 1;
    public showTempHPSlider: boolean = false;

    public damage: number = 0;
    public nonlethal: boolean = false;
    public setTempHP: number = 0;
    public selectedTempHP: { amount: number, source: string, sourceId: string };
    public Math = Math;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private spellsService: SpellsService,
        public characterService: CharacterService,
        public effectsService: EffectsService,
        private conditionsService: ConditionsService,
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
        this.characterService.get_Character().settings.healthMinimized = !this.characterService.get_Character().settings.healthMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.healthMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
            case "Familiar":
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    toggle_DamageSlider() {
        this.showDamageSlider = !this.showDamageSlider;
    }

    toggle_TempHPSlider() {
        this.showTempHPSlider = !this.showTempHPSlider;
    }

    get_Waiting(duration: number) {
        let result: string = "";
        this.characterService.get_Creatures().forEach(creature => {
            if (this.characterService.get_AppliedConditions(creature, "", "", true).some(gain => (gain.nextStage < duration && gain.nextStage > 0) || gain.nextStage == -1 || gain.duration == 1)) {
                result = "One or more conditions" + (creature.type != "Character" ? " on your " + creature.type : "") + " need to be resolved before you can rest.";
            }
            if (this.characterService.get_Health(creature).temporaryHP.length > 1) {
                result = "You need to select one set of temporary Hit Points" + (creature.type != "Character" ? " on your " + creature.type : "") + " before you can rest.";
            }
            if (this.effectsService.get_EffectsOnThis(creature, "Resting Blocked").length) {
                result = "An effect" + (creature.type != "Character" ? " on your " + creature.type : "") + " is keeping you from resting."
            }
        })
        return result;
    }

    rest() {
        this.timeService.rest(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    die(reason: string) {
        if (this.characterService.get_AppliedConditions(this.get_Creature(), "Dead").length == 0) {
            this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Dead", source: reason }), false)
            this.characterService.get_AppliedConditions(this.get_Creature(), "Doomed").forEach(gain => {
                this.characterService.remove_Condition(this.get_Creature(), gain, false);
            })
        }
    }

    get_Health() {
        return this.characterService.get_Health(this.get_Creature());
    }

    calculate_Health(health: Health) {
        let calculatedHealth = health.calculate(this.get_Creature(), this.characterService, this.effectsService);
        if (calculatedHealth.dying >= calculatedHealth.maxDying) {
            if (this.characterService.get_AppliedConditions(this.get_Creature(), "Doomed").length) {
                this.die("Doomed");
            } else {
                this.die("Dying value too high");
            }
        }
        this.damageSliderMax = calculatedHealth.maxHP.result || 1;
        return calculatedHealth;
    }

    on_DyingSave(success, maxDying: number) {
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            this.characterService.get_AppliedConditions(this.get_Creature(), "Dying").forEach(gain => {
                gain.value = Math.max(gain.value - 1, 0);
            })
        } else {
            this.characterService.get_AppliedConditions(this.get_Creature(), "Dying").forEach(gain => {
                gain.value = Math.min(gain.value + 1, maxDying);
            })
            if (this.get_Health().dying(this.get_Creature(), this.characterService) >= maxDying) {
                this.die("Failed Dying Save");
            }
        }
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    on_HeroPointRecover() {
        this.characterService.get_AppliedConditions(this.get_Creature(), "Dying").forEach(gain => {
            this.characterService.remove_Condition(this.get_Creature(), gain, false, false, false);
        });
        this.get_Character().heroPoints = 0;
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.set_ToChange(this.creature, "general");
        this.characterService.process_ToChange();
    }

    on_HealWounded() {
        this.characterService.get_AppliedConditions(this.get_Creature(), "Wounded").forEach(gain => {
            this.characterService.remove_Condition(this.get_Creature(), gain, false);
        })
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    get_NumbToDeath() {
        if (this.get_Creature().type == "Character") {
            return this.get_Character().get_FeatsTaken(0, this.get_Character().level, "Numb to Death").length;
        } else {
            return 0;
        }
    }

    on_Heal(health: Health, dying: number) {
        health.heal(this.get_Creature(), this.characterService, this.effectsService, this.damage, true, true, dying);
        this.characterService.set_ToChange(this.creature, "health");
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    on_NumbToDeath(health: Health, dying: number) {
        health.heal(this.get_Creature(), this.characterService, this.effectsService, this.get_Character().level, true, false, dying);
        this.characterService.set_ToChange(this.creature, "health");
        this.characterService.process_ToChange();
    }

    on_TakeDamage(health: Health, wounded: number, dying: number) {
        health.takeDamage(this.get_Creature(), this.characterService, this.effectsService, this.damage, this.nonlethal, wounded, dying);
        this.characterService.set_ToChange(this.creature, "health");
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    set_TempHP(amount: number) {
        this.get_Health().temporaryHP[0] = { amount: amount, source: "Manual", sourceId: "" };
        this.get_Health().temporaryHP.length = 1;
        this.characterService.set_ToChange(this.creature, "health");
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    on_TempHPSelected(tempSet: { amount: number, source: string, sourceId: string }) {
        this.get_Health().temporaryHP[0] = tempSet;
        this.get_Health().temporaryHP.length = 1;
        this.characterService.set_ToChange(this.creature, "health");
        this.characterService.set_ToChange(this.creature, "effects");
        //Update Health and Time because having multiple temporary HP keeps you from ticking time and resting.
        this.characterService.set_ToChange("Character", "health");
        this.characterService.set_ToChange("Character", "time");
        this.characterService.process_ToChange();
    }

    get_Resistances() {
        //There should be no absolutes in resistances. If there are, they will be treated as relatives here.
        let effects = this.effectsService.get_Effects(this.creature).all.filter(effect =>
            effect.creature == this.get_Creature().id && (effect.target.toLowerCase().includes("resistance") ||
                effect.target.toLowerCase().includes("hardness")) && effect.apply);
        let resistances: { target: string, value: number, source: string }[] = [];
        effects.forEach(effect => {
            let value = effect.value || effect.setValue;
            let resistance = resistances.find(res => res.target == effect.target);
            if (resistance) {
                resistance.value += parseInt(value);
                resistance.source += "\n" + effect.source;
            } else {
                resistances.push({ target: effect.target, value: parseInt(value), source: effect.source });
            }
        });
        resistances.forEach((res: { target: string, value: number, source: string }) => {
            if (res.value < 0) {
                res.target = res.target.toLowerCase().replace("resistance", "weakness");
            }
            res.target = res.target.split(" ").map(word => word[0].toUpperCase() + word.substr(1).toLowerCase()).join(" ");
            if (res.source.includes("\n")) {
                res.source = "\n" + res.source;
            }
        });
        return resistances;
    }

    get_Immunities() {
        let effects = this.effectsService.get_Effects(this.creature).all.filter(effect =>
            effect.creature == this.get_Creature().id && (effect.target.toLowerCase().includes("immunity")));
        let immunities: any[] = [];
        effects.forEach(effect => {
            if (!immunities.some(res => res.target == effect.target)) {
                immunities.push({ target: effect.target, source: effect.source });
            }
        });
        immunities.forEach((res: { value: number, target: string }) => {
            res.target = res.target.split(" ").map(word => word[0].toUpperCase() + word.substr(1).toLowerCase()).join(" ");
        });
        return immunities;
    }

    get_AbsolutesOnThis(name: string) {
        return this.effectsService.get_AbsolutesOnThis(this.get_Creature(), name);
    }

    show_BonusesOnThis(name: string) {
        return this.effectsService.show_BonusesOnThis(this.get_Creature(), name);
    }

    show_PenaltiesOnThis(name: string) {
        return this.effectsService.show_PenaltiesOnThis(this.get_Creature(), name);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["health", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["health", "all"].includes(view.target.toLowerCase())) {
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

import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { TimeService } from 'src/app/services/time.service';
import { TraitsService } from 'src/app/services/traits.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Effect } from 'src/app/classes/Effect';
import { Condition } from 'src/app/classes/Condition';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsComponent implements OnInit, OnDestroy {

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
        private conditionsService: ConditionsService,
        private refreshService: RefreshService,
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
        return this.conditionsService.get_Conditions(name);
    }

    get_AppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && effect.show)
            .sort((a, b) => (a.target + "-" + a.setValue + "-" + a.value == b.target + "-" + b.setValue + "-" + b.value) ? 0 : ((a.target + "-" + a.setValue + "-" + a.value > b.target + "-" + b.setValue + "-" + b.value) ? 1 : -1));
    }

    get_NotAppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && !effect.apply);
    }

    get_HiddenEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && !effect.show);
    }

    get_AppliedConditions(apply: boolean, instant: boolean = false) {
        return this.characterService.get_AppliedConditions(this.get_Creature())
            .filter(gain => gain.apply == apply || (instant && gain.durationIsInstant) || (instant && gain.nextStage == -1))
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    get_IsInformationalCondition(conditionGain: ConditionGain, condition: Condition) {
        return condition.get_IsInformationalCondition(this.get_Creature(), this.characterService, conditionGain);
    }

    get_ConditionSuperTitle(conditionGain: ConditionGain, condition: Condition) {
        if (condition.get_IsStoppingTime(conditionGain)) {
            return "icon-ra ra-hourglass";
        }
        if (conditionGain.paused) {
            return "icon-bi-pause-circle";
        }
        if (condition.get_IsInformationalCondition(this.get_Creature(), this.characterService, conditionGain)) {
            return "icon-bi-info-circle";
        }
        return "";
    }

    get_TimeStopped() {
        return this.get_AppliedConditions(true, true).some(gain => this.conditionsService.get_ConditionFromName(gain.name).get_IsStoppingTime(gain));
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
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["effects", "all", "effects-component", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["effects", "all", "effects-component"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
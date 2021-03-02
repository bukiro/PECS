import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { TimeService } from '../time.service';
import { TraitsService } from '../traits.service';
import { ConditionGain } from '../ConditionGain';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsComponent implements OnInit {

    @Input()
    creature: string = "Character";
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

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature + "-effects");
        })
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

    receive_ItemMessage(name: string) {
        this.toggle_Item(name);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    trackByConditionGainID(index: number, obj: ConditionGain): string {
        return obj.id;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    toggle_NotApplied() {
        this.showNotApplied = !this.showNotApplied;
    }

    toggle_Hidden() {
        this.showHidden = !this.showHidden;
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
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && !effect.hide).sort(function (a, b) {
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
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && !effect.apply && !effect.hide);
    }

    get_HiddenEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.hide);
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

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (target == "effects" || target == "all" || target == this.creature) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == this.creature && ["effects", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                    if (view.creature == "Character" && view.target == "span") {
                        this.set_Span();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
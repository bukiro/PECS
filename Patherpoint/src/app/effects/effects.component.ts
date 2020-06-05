import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { ConditionGain } from '../ConditionGain';
import { TimeService } from '../time.service';
import { AnimalCompanion } from '../AnimalCompanion';
import { Character } from '../Character';

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
        private effectsService: EffectsService,
        private characterService: CharacterService,
        private timeService: TimeService
    ) { }
    
    minimize() {
        this.characterService.get_Character().settings.effectsMinimized = !this.characterService.get_Character().settings.effectsMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-effects");
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

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
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

    get_Effects() {
        return this.effectsService.get_Effects();
    }

    get_Conditions(name: string = "") {
        return this.characterService.get_Conditions(name);
    }

    get_AppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && !effect.hide);
    }

    get_NotAppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && !effect.apply && !effect.hide);
    }

    get_HiddenEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.hide);
    }

    get_AppliedConditions(apply: boolean) {
        return this.characterService.get_AppliedConditions(this.get_Creature()).filter(condition => condition.apply == apply);
    }

    change_ConditionDuration(gain: ConditionGain, turns: number) {
        gain.duration += turns;
    }

    change_ConditionValue(gain: ConditionGain, turns: number) {
        gain.value += turns;
        this.characterService.set_Changed();
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    remove_Condition(conditionGain: ConditionGain) {
        this.characterService.remove_Condition(this.get_Creature(), conditionGain, true);
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
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
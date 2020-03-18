import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { ConditionGain } from '../ConditionGain';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsComponent implements OnInit {

    public showNotApplied: boolean = false;
    public showHidden: boolean = false;
    public showItem: string = "";
    public Math = Math;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private effectsService: EffectsService,
        private characterService: CharacterService,
        private timeService: TimeService
    ) { }

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
        return this.get_Effects().all.filter(effect => effect.apply && !effect.hide);
    }

    get_NotAppliedEffects() {
        return this.get_Effects().all.filter(effect => !effect.apply && !effect.hide);
    }

    get_HiddenEffects() {
        return this.get_Effects().all.filter(effect => effect.apply && effect.hide);
    }

    get_HiddenNotAppliedEffects() {
        return this.get_Effects().all.filter(effect => !effect.apply && effect.hide);
    }

    get_AppliedConditions(apply: boolean) {
        return this.characterService.get_AppliedConditions().filter(condition => condition.apply == apply);
    }

    get_Duration(duration: number) {
        if (duration == -1) {
            return "Permanent";
        } else {
            let returnString: string = ""
            if (duration == this.timeService.get_YourTurn()) {
                return "Rest of turn"
            }
            if (duration >= 144000) {
                returnString += Math.floor(duration / 144000)+" Day"
                if (duration / 144000 > 1) { returnString += "s" }
                duration %= 144000;
            }
            if (duration >= 6000) {
                returnString += " "+Math.floor(duration / 6000)+" Hour"
                if (duration / 6000 > 1) { returnString += "s" }
                duration %= 6000;
            }
            if (duration >= 100) {
                returnString += " "+Math.floor(duration / 100)+" Minute"
                if (duration / 100 > 1) { returnString += "s" }
                duration %= 100;
            }
            if (duration >= 10) {
                returnString += " "+Math.floor(duration / 10)+" Turn"
                if (duration / 10 > 1) { returnString += "s" }
                duration %= 10;
            }
            if (duration == this.timeService.get_YourTurn()) {
                returnString += " to end of turn"
            }
            return returnString;
        }
    }

    remove_Condition(conditionGain: ConditionGain) {
        this.characterService.remove_Condition(conditionGain, true);
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
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
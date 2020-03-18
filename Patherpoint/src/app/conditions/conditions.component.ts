import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { ConditionGain } from '../ConditionGain';
import { ConditionsService } from '../Conditions.service';
import { Condition } from '../Condition';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsComponent implements OnInit {

    public endOn: number = 0;
    public value: number = 1;
    public duration: string = "Permanent";
    public showList: string = "";
    public showItem: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private traitsService: TraitsService,
        private conditionsService: ConditionsService,
        private timeService: TimeService
    ) { }

    toggleList(type) {
        if (this.showList == type) {
            this.showList = "";
        } else {
            this.showList = type;
        }
    }

    toggleItem(type) {
        if (this.showItem == type) {
            this.showItem = "";
        } else {
            this.showItem = type;
        }
    }
    
    get_ShowList() {
        return this.showList;
    }

    get_EndOn() {
        return this.endOn;
    }

    get_ShowItem() {
        return this.showItem;
    }

    still_loading() {
        return this.conditionsService.still_loading() || this.characterService.still_loading();
    }

    toggleConditionsMenu() {
        this.characterService.toggleMenu("conditions");
    }

    get_ConditionsSet(type: string) {
        switch (type) {
            case "Generic":
                return this.get_Conditions("", "generic");
            case "Alchemical Elixirs":
                return this.get_Conditions("", "alchemicalelixirs");
        }
    }
    
    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Conditions(name: string = "", type: string = "") {
        return this.conditionsService.get_Conditions(name, type);
    }

    add_Duration(turns: number) {
        if (turns == -1) {
            this.duration = "Permanent";
        } else {
            if (this.duration == "Permanent") {
                this.duration = turns.toString();
            } else {
                this.duration = (parseInt(this.duration) + turns).toString();
            }
        }
        this.characterService.set_Changed();
    }

    get_Duration() {
        if (this.duration == "Permanent") {
            return this.duration;
        } else {
            let duration = parseInt(this.duration);
            let returnString: string = ""
            if (duration / 144000 >= 1) {
                returnString += Math.floor(duration / 144000)+" Days"
                duration %= 144000;
            }
            if (duration / 6000 >= 1) {
                returnString += " "+Math.floor(duration / 6000)+" Hours"
                duration %= 6000;
            }
            if (duration / 100 >= 1) {
                returnString += " "+Math.floor(duration / 100)+" Minutes"
                duration %= 100;
            }
            if (duration >= 10) {
                returnString += " "+Math.floor(duration / 10)+" Turns"
                duration %= 10;
            }
            return returnString;
        }
    }

    add_Condition(condition: Condition) {
        let newGain = new ConditionGain();
        newGain.name = condition.name;
        newGain.decreasingValue = condition.decreasingValue;
        if (this.duration == "Permanent") {
            newGain.duration = -1;
        } else {
            newGain.duration = parseInt(this.duration) + ((this.endOn + this.timeService.get_YourTurn()) % 10);
        }
        if (condition.hasValue) {
            newGain.value = this.value;
        }
        newGain.source = "Manual";
        this.characterService.add_Condition(newGain, true);
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

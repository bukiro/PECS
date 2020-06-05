import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { TraitsService } from '../traits.service';
import { ConditionGain } from '../ConditionGain';
import { ConditionsService } from '../conditions.service';
import { Condition } from '../Condition';
import { TimeService } from '../time.service';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Familiar } from '../Familiar';
import { SortByPipe } from '../sortBy.pipe';

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsComponent implements OnInit {

    public endOn: number = 0;
    public value: number = 1;
    public heightened: number = 1;
    public persistentDamage: string = "";
    public duration: number = -1;
    public showList: string = "";
    public showItem: string = "";
    public wordFilter: string = "";
        
    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private traitsService: TraitsService,
        private conditionsService: ConditionsService,
        private timeService: TimeService,
        private sortByPipe: SortByPipe
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
    
    get_ShowItem() {
        return this.showItem;
    }

    get_ShowList() {
        return this.showList;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList == "All") {
            this.showList = "";
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = "All";
        }
    }

    get_EndOn() {
        return this.endOn;
    }

    still_loading() {
        return this.conditionsService.still_loading() || this.characterService.still_loading();
    }

    toggleConditionsMenu() {
        this.characterService.toggleMenu("conditions");
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }
    
    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    get_VisibleConditionsSet(type: string) {
        let typeKey = "";
        switch (type) {
            case "Generic":
                typeKey = "generic";
                break;
            case "Alchemical Elixirs":
                typeKey = "alchemicalelixirs";
                break;
            case "Worn Items":
                typeKey = "wornitems";
                break;
            case "Spells":
                typeKey = "spells";
                break;
            case "Activities":
                typeKey = "activities";
                break;
        }
        if (typeKey) {
            return this.sortByPipe.transform(this.get_Conditions("", typeKey).filter(condition => 
                !this.wordFilter || (
                    this.wordFilter && (
                        condition.name.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                        condition.desc.toLowerCase().includes(this.wordFilter.toLowerCase())
                    )
                )
            ), "asc", "name") as Condition[];
        }
    }
    
    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Conditions(name: string = "", type: string = "") {
        return this.conditionsService.get_Conditions(name, type);
    }

    add_Duration(turns: number) {
        if (this.duration == -1 || turns == -1) {
            this.duration = turns;
        } else {
            this.duration = this.duration + turns;
        }
    }

    get_Duration(duration: number = this.duration) {
        if (duration == -1) {
            return "Permanent";
        } else {
            let durationNum = duration;
            let returnString: string = ""
            if (durationNum / 144000 >= 1) {
                returnString += Math.floor(durationNum / 144000)+" Day"
                if (durationNum / 144000 >= 2) { returnString += "s" }
                durationNum %= 144000;
            }
            if (durationNum / 6000 >= 1) {
                returnString += " "+Math.floor(durationNum / 6000)+" Hour"
                if (durationNum / 6000 >= 2) { returnString += "s" }
                durationNum %= 6000;
            }
            if (durationNum / 100 >= 1) {
                returnString += " "+Math.floor(durationNum / 100)+" Minute"
                if (durationNum / 100 >= 2) { returnString += "s" }
                durationNum %= 100;
            }
            if (durationNum >= 10) {
                returnString += " "+Math.floor(durationNum / 10)+" Turn"
                if (durationNum / 10 > 1) { returnString += "s" }
                durationNum %= 10;
            }
            if (returnString.substr(0,1) == " ") {
                returnString = returnString.substr(1);
            }
            return returnString;
        }
    }

    add_Condition(creature: Character|AnimalCompanion|Familiar, condition: Condition) {
        let newGain = new ConditionGain();
        newGain.name = condition.name;
        newGain.decreasingValue = condition.decreasingValue;
        if (this.duration == -1) {
            newGain.duration = this.duration;
        } else {
            newGain.duration = this.duration + ((this.endOn + this.timeService.get_YourTurn()) % 10);
        }
        if (condition.hasValue) {
            newGain.value = this.value;
        }
        if (condition.name == "Persistent Damage") {
            newGain.persistentDamage = this.persistentDamage;
            newGain.value = 0;
        }
        if (condition.type == "spells") {
            newGain.heightened = this.heightened;
        }
        newGain.source = "Manual";
        this.characterService.add_Condition(creature, newGain, true);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "conditions" || target == "all") {
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

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
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsComponent implements OnInit {

    public endOn: number = 5;
    public value: number = 1;
    public heightened: number = 1;
    public showList: string = "";
    public showItem: string = "";
    public wordFilter: string = "";
    public permanent: boolean = true;
    public days: number = 0;
    public hours: number = 0;
    public minutes: number = 0;
    public turns: number = 0;
    private purpose: "conditions"|"customeffects" = "conditions";
        
    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private traitsService: TraitsService,
        private conditionsService: ConditionsService,
        private timeService: TimeService,
        private effectsService: EffectsService,
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

    toggle_Purpose(purpose: "conditions"|"customeffects") {
        this.purpose = purpose;
    }

    get_ShowPurpose() {
        return this.purpose;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList) {
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

    get_ConditionsMenuState() {
        return this.characterService.get_ConditionsMenuState();
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

    get_Creatures(companionAvailable: boolean = undefined, familiarAvailable: boolean = undefined) {
        return this.characterService.get_Creatures(companionAvailable, familiarAvailable);
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
            case "Afflictions":
                typeKey = "afflictions";
                break;
            case "Alchemical Tools":
                typeKey = "alchemicaltools";
                break;
            case "Worn Items":
                typeKey = "wornitems";
                break;
            case "Ammunition":
                typeKey = "ammunition";
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

    set_Permanent() {
        this.permanent = true;
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.turns = 0;
    }

    add_Day(days: number) {
        this.days = Math.max(this.days + days, 0);
        this.permanent = false;
    }

    set_Duration() {
        if (this.permanent) {
            this.permanent = false;
        }
    }

    get_ConditionDuration(includeTurn: boolean = true) {
        return this.permanent ? -1 : 
            (
                this.days * 144000 + 
                this.hours * 6000 + 
                this.minutes * 100 + 
                this.turns * 10 +
                (includeTurn ? (5 + (this.endOn + this.timeService.get_YourTurn()) % 10) : 0)
            )
    }

    get_Duration(duration: number = this.get_ConditionDuration()) {
        return this.timeService.get_Duration(duration, true);
    }

    add_Condition(creature: Character|AnimalCompanion|Familiar, condition: Condition, duration: number = this.get_ConditionDuration(false)) {
        let newGain = new ConditionGain();
        newGain.name = condition.name;
        if (duration == -1) {
            newGain.duration = duration;
        } else {
            newGain.duration = duration + (5 + (this.endOn + this.timeService.get_YourTurn()) % 10);
        }
        newGain.choice = condition.choice;
        if (condition.hasValue) {
            newGain.value = this.value;
        }
        if (condition.type == "spells") {
            newGain.heightened = this.heightened;
        }
        newGain.source = "Manual";
        this.characterService.add_Condition(creature, newGain, true);
    }

    get_EffectsProperty() {
        return this.effectsService.get_EffectProperties().find(property => !property.parent && property.key == "effects");
    }

    update_Effects(creature: string) {
        this.characterService.set_ToChange(creature, "effects");
        this.characterService.process_ToChange();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["conditions", "all"].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == "Character" && ["conditions", "all"].includes(view.target)) {
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

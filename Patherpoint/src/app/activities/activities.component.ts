import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ActivitiesService } from '../activities.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Activity } from '../Activity';
import { ActivityGain } from '../ActivityGain';
import { ItemsService } from '../items.service';
import { Trait } from '../Trait';

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent implements OnInit {

    public showAction: string = "";
    
    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public activitiesService: ActivitiesService,
        public effectsService: EffectsService,
        public traitsService: TraitsService,
        public itemsService: ItemsService
    ) { }

    toggle_Action(name: string) {
        if (this.showAction == name) {
            this.showAction = "";
        } else {
            this.showAction = name;
        }
    }

    get_showAction() {
        return this.showAction;
    }

    get_Abilities() {
       return this.activitiesService.get_Activities();
    }
    
    still_loading() {
        return this.activitiesService.still_loading() || this.characterService.still_loading();
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_OwnedActivities() {
        let activities: ActivityGain[] = [];
        let unique: string[] = [];
        this.characterService.get_Character().class.activities.forEach(activity => {
            if (unique.indexOf(activity.name) == -1) {
                unique.push(activity.name);
                activities.push(activity);
            }
        })
        return activities;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_ActivationTraits(activity: Activity) {
        switch (activity.activationType) {
            case "Command": 
                return ["Auditory", "Concentrate"];
            case "Envision": 
                return ["Concentrate"];
            case "Interact": 
                return ["Manipulate"];
            default:
                return [];
        }
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    get_EffectsOnThis(ObjectName: String) {
        return this.effectsService.get_EffectsOnThis(ObjectName);
    }

    get_ConditionsShowingOn(name: string) {
        return this.characterService.get_ConditionsShowingOn(name);
    }

    on_Activate(gain: ActivityGain, activity: Activity, activated: boolean) {
        this.activitiesService.activate_Activity(this.characterService, this.itemsService, gain, activity, activated);
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
        this.activitiesService.initialize();
        this.finish_Loading();
    }

}
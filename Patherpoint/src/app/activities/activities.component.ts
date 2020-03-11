import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ActivitiesService } from '../activities.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Activity } from '../Activity';

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
        public traitsService: TraitsService
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
        return this.activitiesService.still_loading();
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_OwnedActivities() {
        let character = this.characterService.get_Character();
        let activities: Activity[] = [];
        character.get_FeatsTaken(0, character.level).forEach(feat => {
            let originalFeat = this.characterService.get_FeatsAndFeatures(feat.name)[0];
            if (originalFeat.gainAction) {
                activities.push(this.get_Activities(originalFeat.gainAction)[0]);
            }
        })
        return activities;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
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
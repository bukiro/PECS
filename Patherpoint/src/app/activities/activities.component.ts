import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ActivitiesService } from '../activities.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Activity } from '../Activity';
import { ActivityGain } from '../ActivityGain';
import { ItemsService } from '../items.service';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent implements OnInit {

    private id: number = 0;
    private showAction: number = 0;
    public hover: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private activitiesService: ActivitiesService,
        private itemsService: ItemsService,
        private timeService: TimeService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.activitiesMinimized = !this.characterService.get_Character().settings.activitiesMinimized;
    }

    set_Span() {
        setTimeout(() => {
            document.getElementById("activities").style.gridRow = "span "+this.characterService.get_Span("activities-height");
        })
    }

    toggle_Action(id: number) {
        if (this.showAction == id) {
            this.showAction = 0;
        } else {
            this.showAction = id;
        }
    }

    get_showAction() {
        return this.showAction;
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Accent(hover: number = -1) {
        return this.characterService.get_Accent((hover == this.hover));
    }

    still_loading() {
        return this.activitiesService.still_loading() || this.characterService.still_loading();
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Duration(duration) {
        return this.timeService.get_Duration(duration);
    }

    get_OwnedActivities() {
        this.id = 0;
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

    on_Activate(gain: ActivityGain, activity: Activity, activated: boolean) {
        this.activitiesService.activate_Activity(this.characterService, this.timeService, this.itemsService, gain, activity, activated);
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
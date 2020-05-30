import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { ActivitiesService } from '../activities.service';
import { Activity } from '../Activity';
import { ActivityGain } from '../ActivityGain';
import { ItemsService } from '../items.service';
import { TimeService } from '../time.service';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { SpellsService } from '../spells.service';

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent implements OnInit {

    @Input()
    creature: string = "Character";
    private id: number = 0;
    private showAction: number = 0;
    public hover: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private activitiesService: ActivitiesService,
        private itemsService: ItemsService,
        private spellsService: SpellsService,
        private timeService: TimeService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.activitiesMinimized = !this.characterService.get_Character().settings.activitiesMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-activities");
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

    get_Accent() {
        return this.characterService.get_Accent();
    }

    still_loading() {
        return this.activitiesService.still_loading() || this.characterService.still_loading();
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character|AnimalCompanion;
    }
    
    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_OwnedActivities() {
        this.id = 0;
        let activities: ActivityGain[] = [];
        let unique: string[] = [];
        this.characterService.get_OwnedActivities(this.get_Creature()).forEach(activity => {
            if (!unique.includes(activity.name)) {
                unique.push(activity.name);
                activities.push(activity);
            }
        })
        return activities;
    }

    get_FuseStanceName() {
        let fuseStance = this.characterService.get_Character().customFeats.filter(feat => feat.name == "Fuse Stance");
        if (fuseStance.length && fuseStance[0].data && fuseStance[0].data["name"]) {
            return fuseStance[0].data["name"];
        } else {
            return "Fused Stance";
        }
    }

    on_Activate(gain: ActivityGain, activity: Activity, activated: boolean) {
        this.activitiesService.activate_Activity(this.get_Creature(), this.characterService, this.timeService, this.itemsService, this.spellsService, gain, activity, activated);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (target == "activities" || target == "all" || target == this.creature) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.activitiesService.initialize();
        this.finish_Loading();
    }

}
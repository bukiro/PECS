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
import { FeatChoice } from '../FeatChoice';
import { Level } from '../Level';

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
    private showItem: string = "";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private activitiesService: ActivitiesService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.activitiesMinimized = !this.characterService.get_Character().settings.activitiesMinimized;
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
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
            this.showList = "";
        }
    }

    get_showAction() {
        return this.showAction;
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
            this.showAction = 0;
        }
    }

    receive_ChoiceMessage(name: string) {
        this.toggle_List(name);
    }

    receive_FeatMessage(name: string) {
        this.toggle_Item(name);
    }

    get_showItem() {
        return this.showItem;
    }

    get_showList() {
        return this.showList;
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

    get_TemporaryFeatChoices() {
        let choices: FeatChoice[] = [];
        if (this.creature == "Character") {
            (this.get_Creature() as Character).class.levels.filter(level => level.number <= this.get_Creature().level).forEach(level => {
                choices.push(...level.featChoices.filter(choice => choice.showOnSheet))
            })
        }
        return choices;
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
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["activities", "all"].includes(view.target)) {
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
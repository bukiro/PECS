import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { ActivitiesService } from 'src/app/activities.service';
import { ActivityGain } from 'src/app/ActivityGain';
import { Character } from 'src/app/Character';
import { AnimalCompanion } from 'src/app/AnimalCompanion';
import { FeatChoice } from 'src/app/FeatChoice';
import { ItemActivity } from 'src/app/ItemActivity';

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
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

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.activitiesMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
        }
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
    }

    toggle_Action(id: number) {
        if (this.showAction == id) {
            this.showAction = 0;
        } else {
            this.showAction = id;
            this.showList = "";
        }
    }

    get_ShowAction() {
        return this.showAction;
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string = "") {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
            this.showAction = 0;
        }
    }

    receive_ChoiceNameMessage(name: string) {
        this.toggle_List(name);
    }

    receive_FeatMessage(name: string) {
        this.toggle_Item(name);
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_ShowList() {
        return this.showList;
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    toggle_TileMode() {
        this.get_Character().settings.activitiesTileMode = !this.get_Character().settings.activitiesTileMode;
        this.characterService.set_ToChange("Character", "activities");
        this.characterService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.activitiesTileMode;
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

    get_ClassDCs() {
        return this.characterService.get_Skills(this.get_Creature(), "", "Class DC").filter(skill => skill.level(this.get_Creature() as Character|AnimalCompanion, this.characterService) > 0);
    }

    get_OwnedActivities() {
        this.id = 0;
        let activities: (ActivityGain|ItemActivity)[] = [];
        let unique: string[] = [];
        this.characterService.get_OwnedActivities(this.get_Creature()).forEach(activity => {
            if (activity instanceof ItemActivity) {
                activity.get_Cooldown(this.get_Creature(), this.characterService)
            } else {
                this.get_Activities(activity.name).forEach(actualActivity => {actualActivity.get_Cooldown(this.get_Creature(), this.characterService)})
            }
            if (!unique.includes(activity.name)) {
                unique.push(activity.name);
                activities.push(activity);
            }
        })
        return activities;
    }

    get_FuseStanceName() {
        let fuseStance = this.characterService.get_Character().customFeats.filter(feat => feat.name == "Fuse Stance");
        if (fuseStance.length && fuseStance[0].data?.["name"]) {
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
                    if (target == "activities" || target == "all" || target.toLowerCase() == this.creature.toLowerCase()) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["activities", "all"].includes(view.target.toLowerCase())) {
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
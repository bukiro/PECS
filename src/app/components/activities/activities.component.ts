import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesService } from 'src/app/services/activities.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent implements OnInit, OnDestroy {

    @Input()
    creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    private showAction: number = 0;
    private showItem: string = "";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
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

    get_Character() {
        return this.characterService.get_Character();
    }

    toggle_TileMode() {
        this.get_Character().settings.activitiesTileMode = !this.get_Character().settings.activitiesTileMode;
        this.refreshService.set_ToChange("Character", "activities");
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.activitiesTileMode;
    }

    still_loading() {
        return this.activitiesService.still_loading() || this.characterService.still_loading();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character | AnimalCompanion;
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_ClassDCs() {
        return this.characterService.get_Skills(this.get_Creature(), "", { type: "Class DC" }).filter(skill => skill.level(this.get_Creature() as Character | AnimalCompanion, this.characterService) > 0);
    }

    get_OwnedActivities() {
        let activities: (ActivityGain | ItemActivity)[] = [];
        let unique: string[] = [];
        this.characterService.get_OwnedActivities(this.get_Creature()).forEach(activity => {
            activity.get_OriginalActivity(this.activitiesService)?.get_Cooldown(this.get_Creature(), this.characterService);
            if (!unique.includes(activity.name) || activity instanceof ItemActivity) {
                unique.push(activity.name);
                activities.push(activity);
            }
        })
        return activities;
    }

    get_FuseStanceName() {
        let data = this.get_Character().class.get_FeatData(0, 0, "Fuse Stance")[0];
        if (data) {
            return data.data?.["name"] || "Fused Stance";
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
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (target == "activities" || target == "all" || target.toLowerCase() == this.creature.toLowerCase()) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
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

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
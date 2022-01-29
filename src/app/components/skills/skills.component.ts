import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SkillsService } from 'src/app/services/skills.service';
import { FeatsService } from 'src/app/services/feats.service';
import { Character } from 'src/app/classes/Character';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { EffectsService } from 'src/app/services/effects.service';
import { Speed } from 'src/app/classes/Speed';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivitiesService } from 'src/app/services/activities.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit, OnDestroy {

    @Input()
    creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    private showList: string = "";
    private showAction: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        public skillsService: SkillsService,
        public featsService: FeatsService,
        public effectsService: EffectsService,
        private activitiesService: ActivitiesService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.skillsMinimized = !this.characterService.get_Character().settings.skillsMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.skillsMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
            case "Familiar":
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    toggle_Action(id: string) {
        if (this.showAction == id) {
            this.showAction = "";
        } else {
            this.showAction = id;
        }
    }

    get_ShowAction() {
        return this.showAction;
    }

    receive_ActionMessage(id: string) {
        this.toggle_Action(id);
    }

    receive_ChoiceMessage(message: { name: string, levelNumber: number, choice: SkillChoice }) {
        this.toggle_List(message.name);
    }

    toggle_TileMode() {
        this.get_Character().settings.skillsTileMode = !this.get_Character().settings.skillsTileMode;
        this.refreshService.set_ToChange("Character", "skills");
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.skillsTileMode;
    }

    get_Skills(name: string = "", filter: { type?: string, locked?: boolean } = {}) {
        filter = Object.assign({
            type: "",
            locked: undefined
        }, filter);
        let creature = this.get_Creature();
        return this.characterService.get_Skills(creature, name, filter)
        .filter(skill =>
            !skill.name.includes("Lore") ||
            skill.level(creature as Character, this.characterService, creature.level)
        ).sort((a, b) => (a.name > b.name) ? 1 : -1);;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    have_Feat(name: string) {
        return this.characterService.get_CharacterFeatsTaken(1, this.characterService.get_Character().level, name).length;
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_OwnedActivities() {
        let activities: (ActivityGain | ItemActivity)[] = [];
        let unique: string[] = [];
        if (this.get_Character().settings.showSkillActivities) {
            this.characterService.get_OwnedActivities(this.get_Creature()).forEach(activity => {
                activity.get_OriginalActivity(this.activitiesService)?.get_Cooldown(this.get_Creature(), this.characterService);
                if (!unique.includes(activity.name)) {
                    unique.push(activity.name);
                    activities.push(activity);
                }
            })
        }
        return activities;
    }

    get_SkillActivities(activities: (ActivityGain | ItemActivity)[], skillName: string) {
        //Filter activities whose showonSkill or whose original activity's showonSkill includes this skill's name.
        return activities.filter(activity => (activity.get_OriginalActivity(this.activitiesService)?.showonSkill || "").toLowerCase().includes(skillName.toLowerCase()));
    }

    get_Senses() {
        return this.characterService.get_Senses(this.get_Creature());
    }

    get_Speeds() {
        let speeds: Speed[] = this.characterService.get_Speeds(this.get_Creature());
        if (["Character", "Companion"].includes(this.get_Creature().type)) {
            (this.get_Creature() as Character).class?.ancestry?.speeds?.forEach(speed => {
                speeds.push(new Speed(speed.name));
            });
        }
        //We don't process the values yet - for now we just collect all Speeds that are mentioned in effects.
        // Since we pick up every effect that includes "Speed", but we don't want "Ignore Circumstance Penalties To Speed" to show up, we filter out "Ignore".
        let speedEffects = this.effectsService.get_Effects(this.creature).all.filter(effect => effect.apply && !effect.ignored && (effect.target.includes("Speed") && !effect.target.includes("Ignore")));
        speedEffects.forEach(effect => {
            if (!speeds.some(speed => speed.name == effect.target)) {
                speeds.push(new Speed(effect.target))
            }
        });
        //Remove any duplicates for display
        let uniqueSpeeds: Speed[] = [];
        speeds.forEach(speed => {
            if (!uniqueSpeeds.find(uniqueSpeed => uniqueSpeed.name == speed.name)) {
                uniqueSpeeds.push(speed);
            }
        })
        return uniqueSpeeds.filter(speed => speed.value(this.get_Creature(), this.characterService, this.effectsService)[0] != 0);
    }

    get_SkillChoices() {
        if (this.creature == "Character") {
            let character = (this.get_Creature() as Character);
            let choices: SkillChoice[] = [];
            character.class.levels.filter(level => level.number <= character.level).forEach(level => {
                choices.push(...level.skillChoices.filter(choice => choice.showOnSheet))
            });
            return choices;
        }
    }

    get_SenseDesc(sense: string) {
        switch (sense) {
            case "Darkvision":
                return "You can see in darkness and dim light just as well as you can see in bright light, though your vision in darkness is in black and white."
            case "Greater Darkvision":
                return "You can see in darkness and dim light just as well as you can see in bright light, though your vision in darkness is in black and white. Some forms of magical darkness, such as a 4th-level darkness spell, block normal darkvision. A creature with greater darkvision, however, can see through even these forms of magical darkness."
            case "Low-Light Vision":
                return "You can see in dim light as though it were bright light, and you ignore the concealed condition due to dim light."
            default:
                if (sense.includes("Scent")) {
                    return "You can use your sense of smell to determine the location of a creature, but it remains hidden."
                }
                if (sense.includes("Tremorsense")) {
                    return "You can feel the vibrations through a solid surface caused by movement."
                }
        }
    }

    still_loading() {
        return this.skillsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["skills", "alls", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["skills", "all"].includes(view.target.toLowerCase())) {
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
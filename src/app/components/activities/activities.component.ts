import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesService } from 'src/app/services/activities.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Character } from 'src/app/classes/Character';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { EffectsService } from 'src/app/services/effects.service';
import { Activity } from 'src/app/classes/Activity';
import { TimeService } from 'src/app/services/time.service';
import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';

type ActivitySet = {
    name: string,
    gain: ActivityGain | ItemActivity,
    activity: Activity | ItemActivity,
}

type ActivityParameter = {
    name: string,
    gain: ActivityGain | ItemActivity,
    activity: Activity | ItemActivity,
    maxCharges: number,
    disabled: string,
    hostile: boolean,
}

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent implements OnInit, OnDestroy {

    @Input()
    public creature = 'Character';
    @Input()
    public sheetSide = 'left';
    private showActivity = '';
    private showItem = '';
    private showFeatChoice = '';

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private effectsService: EffectsService,
        private timeService: TimeService,
        private refreshService: RefreshService,
        private activitiesService: ActivitiesService
    ) { }

    public minimize(): void {
        this.characterService.get_Character().settings.activitiesMinimized = !this.characterService.get_Character().settings.activitiesMinimized;
    }

    public get_Minimized(): boolean {
        switch (this.creature) {
            case 'Character':
                return this.characterService.get_Character().settings.activitiesMinimized;
            case 'Companion':
                return this.characterService.get_Character().settings.companionMinimized;
        }
    }

    public trackByIndex(index: number): number {
        return index;
    }

    public toggle_Activity(id: string): void {
        if (this.showActivity == id) {
            this.showActivity = '';
        } else {
            this.showActivity = id;
            this.showFeatChoice = '';
        }
    }

    public get_ShowActivity(): string {
        return this.showActivity;
    }

    private toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = '';
        } else {
            this.showItem = name;
        }
    }

    private toggle_FeatChoice(name = ''): void {
        if (this.showFeatChoice == name) {
            this.showFeatChoice = '';
        } else {
            this.showFeatChoice = name;
            this.showActivity = '';
        }
    }

    public receive_FeatChoiceMessage(name: string): void {
        this.toggle_FeatChoice(name);
    }

    public receive_FeatMessage(name: string): void {
        this.toggle_Item(name);
    }

    public get_ShowItem(): string {
        return this.showItem;
    }

    public get_ShowFeatChoice(): string {
        return this.showFeatChoice;
    }

    private get_Character(): Character {
        return this.characterService.get_Character();
    }

    public toggle_TileMode(): void {
        this.get_Character().settings.activitiesTileMode = !this.get_Character().settings.activitiesTileMode;
        this.refreshService.set_ToChange('Character', 'activities');
        this.refreshService.process_ToChange();
    }

    public get_TileMode(): boolean {
        return this.get_Character().settings.activitiesTileMode;
    }

    public still_loading(): boolean {
        return this.activitiesService.still_loading() || this.characterService.still_loading();
    }

    public get_Creature(): Creature {
        return this.characterService.get_Creature(this.creature);
    }

    public get_ActivityParameters(): ActivityParameter[] {
        return this.get_OwnedActivities().map(gainSet => {
            const creature = this.get_Creature();
            const maxCharges = gainSet.activity.maxCharges({ creature }, { effectsService: this.effectsService });
            return {
                name: gainSet.name,
                gain: gainSet.gain,
                activity: gainSet.activity,
                maxCharges,
                disabled: gainSet.gain.disabled({ creature, maxCharges }, { effectsService: this.effectsService, timeService: this.timeService }),
                hostile: gainSet.activity.get_IsHostile()
            };
        });
    }

    public get_ClassDCs(): Skill[] {
        return this.characterService.get_Skills(this.get_Creature(), '', { type: 'Class DC' }).filter(skill => skill.level(this.get_Creature(), this.characterService) > 0);
    }

    private get_OwnedActivities(): ActivitySet[] {
        const activities: ActivitySet[] = [];
        const unique: string[] = [];
        const fuseStanceName = this.get_FuseStanceName();
        function activityName(name: string) {
            if (!!fuseStanceName && name === 'Fused Stance') {
                return fuseStanceName;
            } else {
                return name;
            }
        }
        this.characterService.get_OwnedActivities(this.get_Creature()).forEach(gain => {
            const activity = gain.get_OriginalActivity(this.activitiesService);
            activity?.get_Cooldown({ creature: this.get_Creature() }, { characterService: this.characterService, effectsService: this.effectsService });
            if (!unique.includes(gain.name) || gain instanceof ItemActivity) {
                unique.push(gain.name);
                activities.push({ name: activityName(gain.name), gain, activity });
            }
        });
        return activities.sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    private get_FuseStanceName(): string {
        const data = this.get_Character().class.get_FeatData(0, 0, 'Fuse Stance')[0];
        if (data) {
            return data.valueAsString('name') || 'Fused Stance';
        } else {
            return null;
        }
    }

    public get_TemporaryFeatChoices(): FeatChoice[] {
        const choices: FeatChoice[] = [];
        if (this.creature == 'Character') {
            (this.get_Creature() as Character).class.levels.filter(level => level.number <= this.get_Creature().level).forEach(level => {
                choices.push(...level.featChoices.filter(choice => choice.showOnSheet));
            });
        }
        return choices;
    }

    private finish_Loading(): void {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500);
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (target == 'activities' || target == 'all' || target.toLowerCase() == this.creature.toLowerCase()) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['activities', 'all'].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
        }
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    public ngOnDestroy(): void {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}

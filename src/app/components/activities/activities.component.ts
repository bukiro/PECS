import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Character } from 'src/app/classes/Character';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Activity } from 'src/app/classes/Activity';
import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { StatusService } from 'src/app/core/services/status/status.service';

interface ActivitySet {
    name: string;
    gain: ActivityGain | ItemActivity;
    activity: Activity | ItemActivity;
}

interface ActivityParameter {
    name: string;
    gain: ActivityGain | ItemActivity;
    activity: Activity | ItemActivity;
    maxCharges: number;
    disabled: string;
    hostile: boolean;
}

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivitiesComponent implements OnInit, OnDestroy {

    @Input()
    public creature = CreatureTypes.Character;

    private _showActivity = '';
    private _showItem = '';
    private _showFeatChoice = '';
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _skillsDataService: SkillsDataService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        return this.creature === CreatureTypes.AnimalCompanion
            ? CreatureService.character.settings.companionMinimized
            : CreatureService.character.settings.abilitiesMinimized;
    }

    public get isTileMode(): boolean {
        return this._character.settings.activitiesTileMode;
    }

    public get stillLoading(): boolean {
        return this._activitiesDataService.stillLoading || StatusService.isLoadingCharacter;
    }

    public get currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public minimize(): void {
        CreatureService.character.settings.activitiesMinimized = !CreatureService.character.settings.activitiesMinimized;
    }

    public toggleShownActivity(id: string): void {
        this._showActivity = this._showActivity = id ? '' : id;
    }

    public shownActivity(): string {
        return this._showActivity;
    }

    public receiveShownFeatChoiceMessage(name: string): void {
        this._toggleShownFeatChoice(name);
    }

    public receiveShownFeatMessage(name: string): void {
        this._toggleShownItem(name);
    }

    public shownItem(): string {
        return this._showItem;
    }

    public shownFeatChoice(): string {
        return this._showFeatChoice;
    }

    public toggleTileMode(): void {
        this._character.settings.activitiesTileMode = !this._character.settings.activitiesTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public activityParameters(): Array<ActivityParameter> {
        return this._ownedActivities().map(gainSet => {
            const creature = this.currentCreature;

            this._activityPropertiesService.cacheMaxCharges(gainSet.activity, { creature });

            const maxCharges = gainSet.activity.$charges;

            return {
                name: gainSet.name,
                gain: gainSet.gain,
                activity: gainSet.activity,
                maxCharges,
                disabled: this._activityGainPropertyService.gainDisabledReason(gainSet.gain, { creature, maxCharges }),
                hostile: gainSet.activity.isHostile(),
            };
        });
    }

    public classDCs(): Array<Skill> {
        return this._skillsDataService
            .skills(this.currentCreature.customSkills, '', { type: 'Class DC' })
            .filter(skill => this._skillValuesService.level(skill, this.currentCreature) > 0);
    }

    public temporaryFeatChoices(): Array<FeatChoice> {
        const choices: Array<FeatChoice> = [];

        if (this.creature === CreatureTypes.Character) {
            (this.currentCreature as Character).class.levels
                .filter(level => level.number <= this.currentCreature.level)
                .forEach(level => {
                    choices.push(...level.featChoices.filter(choice => choice.showOnSheet));
                });
        }

        return choices;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (target === 'activities' || target === 'all' || target.toLowerCase() === this.creature.toLowerCase()) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['activities', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _toggleShownItem(name: string): void {
        this._showItem = this._showItem === name ? '' : name;
    }

    private _toggleShownFeatChoice(name = ''): void {
        if (this._showFeatChoice === name) {
            this._showFeatChoice = '';
        } else {
            this._showFeatChoice = name;
            this._showActivity = '';
        }
    }

    private _fuseStanceName(): string | undefined {
        const data = this._character.class.filteredFeatData(0, 0, 'Fuse Stance')[0];

        if (data) {
            return data.valueAsString('name') || 'Fused Stance';
        }
    }

    private _ownedActivities(): Array<ActivitySet> {
        const activities: Array<ActivitySet> = [];
        const unique: Array<string> = [];
        const fuseStanceName = this._fuseStanceName();

        const activityName = (name: string): string => {
            if (!!fuseStanceName && name === 'Fused Stance') {
                return fuseStanceName;
            } else {
                return name;
            }
        };

        this._creatureActivitiesService.creatureOwnedActivities(this.currentCreature).forEach(gain => {
            const activity = gain.originalActivity;

            this._activityPropertiesService.cacheEffectiveCooldown(activity, { creature: this.currentCreature });

            if (!unique.includes(gain.name) || gain instanceof ItemActivity) {
                unique.push(gain.name);
                activities.push({ name: activityName(gain.name), gain, activity });
            }
        });

        return activities.sort((a, b) => SortAlphaNum(a.name, b.name));
    }

}

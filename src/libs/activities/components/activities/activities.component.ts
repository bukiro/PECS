import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, HostBinding } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Character } from 'src/app/classes/Character';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { map, Subscription } from 'rxjs';
import { Activity } from 'src/app/classes/Activity';
import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

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
export class ActivitiesComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public forceMinimized?: boolean;

    @Input()
    public creature = CreatureTypes.Character;

    private _isMinimized = false;
    private _showActivity = '';
    private _showItem = '';
    private _showFeatChoice = '';

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _skillsDataService: SkillsDataService,
    ) {
        super();

        CreatureService.settings$
            .pipe(
                map(settings => {
                    switch (this.creature) {
                        case CreatureTypes.AnimalCompanion:
                            return settings.companionMinimized;
                        case CreatureTypes.Familiar:
                            return settings.familiarMinimized;
                        default:
                            return settings.activitiesMinimized;
                    }
                }),
            )
            .subscribe(minimized => {
                this._isMinimized = minimized;
            });
    }

    @HostBinding('class.minimized')
    public get isMinimized(): boolean {
        return this.forceMinimized || this._isMinimized;
    }

    public set isMinimized(minimized: boolean) {
        CreatureService.settings.activitiesMinimized = minimized;
    }

    public get shouldShowMinimizeButton(): boolean {
        return !this.forceMinimized && this.creature === CreatureTypes.Character;
    }

    public get isTileMode(): boolean {
        return this._character.settings.activitiesTileMode;
    }

    public get currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    private get _character(): Character {
        return CreatureService.character;
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

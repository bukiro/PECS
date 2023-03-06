import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { Skill } from 'src/app/classes/Skill';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature, SkillNotes } from 'src/app/classes/Creature';
import { Activity } from 'src/app/classes/Activity';
import { CalculatedSkill, SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface ActivityParameters {
    gain: ActivityGain | ItemActivity;
    activity: Activity;
    maxCharges: number;
    cannotActivate: boolean;
}

@Component({
    selector: 'app-skill',
    templateUrl: './skill.component.html',
    styleUrls: ['./skill.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public skill!: Skill;
    @Input()
    public showValue = true;
    @Input()
    public isDC = false;
    @Input()
    public relatedActivityGains: Array<ActivityGain | ItemActivity> = [];
    @Input()
    public showAction = '';
    @Input()
    public minimized = false;
    @Output()
    public readonly showActionMessage = new EventEmitter<string>();

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertiesService: ActivityGainPropertiesService,
    ) {
        super();
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get isTileMode(): boolean {
        return this.character.settings.skillsTileMode;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public toggleShownAction(id: string): void {
        this.showAction = this.showAction === id ? '' : id;

        this.showActionMessage.emit(this.showAction);
    }

    public shownAction(): string {
        return this.showAction;
    }

    public calculatedSkill(): CalculatedSkill {
        return this._skillValuesService.calculate(
            this.skill,
            this._currentCreature,
            this.character.level,
            this.isDC,
        );
    }

    public skillNotes(skill: Skill): SkillNotes {
        const foundCustomSkill = this._currentCreature.customSkills.find(customSkill => customSkill.name === skill.name);

        if (foundCustomSkill) {
            return foundCustomSkill;
        }

        const foundSkillNotes = this._currentCreature.skillNotes.find(note => note.name === skill.name);

        if (foundSkillNotes) {
            return foundSkillNotes;
        } else {
            const newLength = this._currentCreature.skillNotes.push({ name: skill.name, showNotes: false, notes: '' });

            return this._currentCreature.skillNotes[newLength - 1];
        }
    }

    public skillProficiencyLevel(): number {
        return this._skillValuesService.level(this.skill, this._currentCreature, this.character.level, false);
    }

    public relatedActivityParameters(): Array<ActivityParameters> {
        return this.relatedActivityGains.map(gain => {
            const activity = gain.originalActivity;

            this._activityPropertiesService.cacheMaxCharges(activity, { creature: this._currentCreature });

            const maxCharges = activity.$charges;

            return {
                gain,
                activity,
                maxCharges,
                cannotActivate: ((gain.activeCooldown ? (maxCharges === gain.chargesUsed) : false) && !gain.active),
            };
        });
    }

    public displayName(skill: Skill): string {
        if (!this.isDC && skill.name.includes('Spell DC')) {
            return skill.name.replace('Spell DC', 'Spell Attack');
        } else {
            return skill.name;
        }
    }

    public fuseStanceName(): string {
        const data = this.character.class.filteredFeatData(0, 0, 'Fuse Stance')[0];

        if (data) {
            return data.valueAsString('name') || 'Fused Stance';
        } else {
            return 'Fused Stance';
        }
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if ([
                    'individualskills',
                    'all',
                    this.creature.toLowerCase(),
                    this.skill.name.toLowerCase(),
                ].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                const displayName = this.displayName(this.skill).toLowerCase();

                if (view.creature === this.creature &&
                    (
                        view.target === 'all' ||
                        (view.target === 'individualskills' &&
                            (
                                [
                                    this.skill.name.toLowerCase(),
                                    this.skill.ability.toLowerCase(),
                                    'all',
                                ].includes(view.subtarget.toLowerCase()) ||
                                (
                                    displayName.includes('attack') &&
                                    view.subtarget.toLowerCase() === 'attacks'
                                ) ||
                                (
                                    displayName.includes('spell attack') &&
                                    view.subtarget.toLowerCase().includes('spell attack')
                                ) ||
                                (
                                    displayName.includes('spell dc') &&
                                    view.subtarget.toLowerCase().includes('spell dc')
                                ) ||
                                (
                                    displayName.includes('class dc') &&
                                    view.subtarget.toLowerCase().includes('class dc')
                                )
                            )
                        )
                    )) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}

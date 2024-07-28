/* eslint-disable complexity */
import {
    Component,
    OnInit,
    Input,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Output,
    EventEmitter,
    OnDestroy,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { Observable, Subscription, map, switchMap, of } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature, SkillNotes } from 'src/app/classes/creatures/creature';
import { Skill } from 'src/app/classes/skills/skill';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SkillLiveValue, SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { StickyPopoverDirective } from '../../../sticky-popover/directives/sticky-popover/sticky-popover.directive';
import { ActivityComponent } from '../../../activity/components/activity/activity.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { FormsModule } from '@angular/forms';
import { NgbCollapse, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TagsComponent } from '../../../tags/components/tags/tags.component';
import { AttributeValueComponent } from 'src/libs/shared/ui/attribute-value/components/attribute-value/attribute-value.component';
import { SkillProficiencyComponent } from '../skill-proficiency/skill-proficiency.component';
import { CommonModule } from '@angular/common';

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
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbCollapse,
        NgbTooltip,

        SkillProficiencyComponent,
        AttributeValueComponent,
        TagsComponent,
        ActionIconsComponent,
        ActivityComponent,
        StickyPopoverDirective,
        GridIconComponent,
    ],
})
export class SkillComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy, OnChanges {

    @Input()
    public creature: Creature = CreatureService.character;

    @Input({ required: true })
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
    public isMinimized = false;

    @Input()
    public isTileMode = false;

    @Output()
    public readonly showActionMessage = new EventEmitter<string>();

    public skillValue$?: Observable<SkillLiveValue>;
    public fusedStanceName$: Observable<string>;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
    ) {
        super();

        this.fusedStanceName$ = this._fusedStanceName$();
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.skill || changes.creature || changes.isDC) {
            this.skillValue$ = this._skillValuesService.liveValue$(
                this.skill,
                this.creature,
                this.isDC,
            );
        }
    }

    public toggleShownAction(id: string): void {
        this.showAction = this.showAction === id ? '' : id;

        this.showActionMessage.emit(this.showAction);
    }

    public shownAction(): string {
        return this.showAction;
    }

    public skillNotes(skill: Skill): SkillNotes {
        const foundCustomSkill = this.creature.customSkills.find(customSkill => customSkill.name === skill.name);

        if (foundCustomSkill) {
            return foundCustomSkill;
        }

        const foundSkillNotes = this.creature.skillNotes.find(note => note.name === skill.name);

        if (foundSkillNotes) {
            return foundSkillNotes;
        } else {
            const newSkillNotes = { name: skill.name, showNotes: false, notes: '' };

            this.creature.skillNotes.push(newSkillNotes);

            return newSkillNotes;
        }
    }

    public relatedActivityParameters$(): Observable<Array<ActivityParameters>> {
        return emptySafeCombineLatest(
            this.relatedActivityGains.map(gain => {
                const activity = gain.originalActivity;

                return this._activityPropertiesService.effectiveMaxCharges$(activity, { creature: this.creature })
                    .pipe(
                        map(maxCharges => ({
                            gain,
                            activity,
                            maxCharges,
                            cannotActivate: ((gain.activeCooldown ? (maxCharges === gain.chargesUsed) : false) && !gain.active),
                        })),
                    );
            }),
        );
    }

    public displayName(skill: Skill): string {
        if (!this.isDC && skill.name.includes('Spell DC')) {
            return skill.name.replace('Spell DC', 'Spell Attack');
        } else {
            return skill.name;
        }
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if ([
                    'individualskills',
                    'all',
                    'allskills',
                    this.creature.type.toLowerCase(),
                    this.skill.name.toLowerCase(),
                ].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                const displayName = this.displayName(this.skill).toLowerCase();

                if (stringEqualsCaseInsensitive(view.creature, this.creature.type) &&
                    (
                        view.target === 'all' ||
                        view.target === 'allskills' ||
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

    private _fusedStanceName$(): Observable<string> {
        return this.character.class.filteredFeatData$(0, 0, 'Fuse Stance')
            .pipe(
                switchMap(fuseStanceData => (
                    fuseStanceData[0]
                        ? fuseStanceData[0].valueAsString$('name')
                            .pipe(
                                map(value => value ?? 'Fused Stance'),
                            )
                        : of('Fused Stance')
                )),
            );
    }

}

import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { SkillsService } from 'src/app/services/skills.service';
import { CharacterService } from 'src/app/services/character.service';
import { TraitsService } from 'src/app/services/traits.service';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { EffectsService } from 'src/app/services/effects.service';
import { CalculatedSkill, Skill } from 'src/app/classes/Skill';
import { DiceService } from 'src/app/services/dice.service';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature, SkillNotes } from 'src/app/classes/Creature';
import { Activity } from 'src/app/classes/Activity';

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
export class SkillComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public skill: Skill;
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

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _diceService: DiceService,
        private readonly _abilitiesService: AbilitiesDataService,
        private readonly _skillsService: SkillsService,
        private readonly _traitsService: TraitsService,
        private readonly _effectsService: EffectsService,
        private readonly _activitiesService: ActivitiesDataService,
        public trackers: Trackers,
    ) { }

    public get character(): Character {
        return this._characterService.character;
    }

    public get isTileMode(): boolean {
        return this.character.settings.skillsTileMode;
    }

    private get _currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    public toggleShownAction(id: string): void {
        this.showAction = this.showAction === id ? '' : id;

        this.showActionMessage.emit(this.showAction);
    }

    public shownAction(): string {
        return this.showAction;
    }

    public calculatedSkill(): CalculatedSkill {
        return this.skill.calculate(
            this._currentCreature,
            this._characterService,
            this._abilitiesService,
            this._effectsService,
            this.character.level,
            this.isDC,
        );
    }

    public skillNotes(skill: Skill): SkillNotes {
        const foundCustomSkill = this._currentCreature.customSkills.find(customSkill => customSkill.name === skill.name);

        if (foundCustomSkill) {
            return foundCustomSkill;
        } else {
            const foundSkillNotes = this._currentCreature.skillNotes.find(note => note.name === skill.name);

            if (foundSkillNotes) {
                return foundSkillNotes;
            } else {
                this._currentCreature.skillNotes.push({ name: skill.name, showNotes: false, notes: '' });

                return this._currentCreature.skillNotes.find(note => note.name === skill.name);
            }
        }
    }

    public skillProficiencyLevel(): number {
        return this.skill.level(this._currentCreature, this._characterService, this.character.level, false);
    }

    public originalActivity(gain: ActivityGain | ItemActivity): Activity {
        return gain.originalActivity(this._activitiesService);
    }

    public relatedActivityParameters(): Array<ActivityParameters> {
        return this.relatedActivityGains.map(gain => {
            const activity = gain.originalActivity(this._activitiesService);
            const maxCharges = activity.maxCharges({ creature: this._currentCreature }, { effectsService: this._effectsService });

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

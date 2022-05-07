import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { SkillsService } from 'src/app/services/skills.service';
import { CharacterService } from 'src/app/services/character.service';
import { TraitsService } from 'src/app/services/traits.service';
import { AbilitiesService } from 'src/app/services/abilities.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Skill } from 'src/app/classes/Skill';
import { DiceService } from 'src/app/services/dice.service';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ActivitiesService } from 'src/app/services/activities.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-skill',
    templateUrl: './skill.component.html',
    styleUrls: ['./skill.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    skill: Skill;
    @Input()
    showValue = true;
    @Input()
    isDC = false;
    @Input()
    relatedActivityGains: Array<ActivityGain | ItemActivity> = [];
    @Input()
    showAction = '';
    @Input()
    minimized = false;
    @Output()
    showActionMessage = new EventEmitter<string>();

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        public diceService: DiceService,
        public abilitiesService: AbilitiesService,
        public skillsService: SkillsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
        private readonly activitiesService: ActivitiesService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    toggle_Action(id: string) {
        if (this.showAction == id) {
            this.showAction = '';
        } else {
            this.showAction = id;
        }

        this.showActionMessage.emit(this.showAction);
    }

    get_ShowAction() {
        return this.showAction;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_TileMode() {
        return this.get_Character().settings.skillsTileMode;
    }

    get_Name(skill: Skill) {
        if (!this.isDC && skill.name.includes('Spell DC')) {
            return skill.name.replace('Spell DC', 'Spell Attack');
        } else {
            return skill.name;
        }
    }

    get_Notes(skill: Skill) {
        if (this.get_Creature().customSkills.some(customSkill => customSkill.name == skill.name)) {
            return skill;
        } else {
            if (this.get_Creature().skillNotes.some(note => note.name == skill.name)) {
                return this.get_Creature().skillNotes.find(note => note.name == skill.name);
            } else {
                this.get_Creature().skillNotes.push({ name: skill.name, showNotes: false, notes: '' });

                return this.get_Creature().skillNotes.find(note => note.name == skill.name);
            }
        }
    }

    get_OriginalActivity(gain: ActivityGain | ItemActivity) {
        return gain.originalActivity(this.activitiesService);
    }

    public get_FuseStanceName(): string {
        const data = this.get_Character().class.get_FeatData(0, 0, 'Fuse Stance')[0];

        if (data) {
            return data.valueAsString('name') || 'Fused Stance';
        } else {
            return 'Fused Stance';
        }
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['individualskills', 'all', this.creature.toLowerCase(), this.skill.name.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature == this.creature &&
                    (
                        view.target == 'all' ||
                        (view.target == 'individualskills' &&
                            (
                                [this.skill.name.toLowerCase(), this.skill.ability.toLowerCase(), 'all'].includes(view.subtarget.toLowerCase()) ||
                                (
                                    this.get_Name(this.skill).toLowerCase()
                                        .includes('attack') &&
                                    view.subtarget.toLowerCase() == 'attacks'
                                ) ||
                                (
                                    this.get_Name(this.skill).toLowerCase()
                                        .includes('spell attack') &&
                                    view.subtarget.toLowerCase().includes('spell attack')
                                ) ||
                                (
                                    this.get_Name(this.skill).toLowerCase()
                                        .includes('spell dc') &&
                                    view.subtarget.toLowerCase().includes('spell dc')
                                ) ||
                                (
                                    this.get_Name(this.skill).toLowerCase()
                                        .includes('class dc') &&
                                    view.subtarget.toLowerCase().includes('class dc')
                                )
                            )
                        )
                    )) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}

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
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Skill } from 'src/app/classes/Skill';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    public sheetSide = 'left';
    private showList = '';
    private showAction = '';

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        public skillsService: SkillsService,
        public featsService: FeatsService,
        public effectsService: EffectsService,
        private readonly activitiesService: ActivitiesDataService,
    ) { }

    minimize() {
        this.characterService.character().settings.skillsMinimized = !this.characterService.character().settings.skillsMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case 'Character':
                return this.characterService.character().settings.skillsMinimized;
            case 'Companion':
                return this.characterService.character().settings.companionMinimized;
            case 'Familiar':
                return this.characterService.character().settings.familiarMinimized;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = '';
        } else {
            this.showList = name;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    toggle_Action(id: string) {
        if (this.showAction == id) {
            this.showAction = '';
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

    receive_ChoiceMessage(message: { name: string; levelNumber: number; choice: SkillChoice }) {
        this.toggle_List(message.name);
    }

    toggle_TileMode() {
        this.get_Character().settings.skillsTileMode = !this.get_Character().settings.skillsTileMode;
        this.refreshService.set_ToChange('Character', 'skills');
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.skillsTileMode;
    }

    get_Skills(name = '', filter: { type?: string; locked?: boolean } = {}): Array<Skill> {
        filter = {
            type: '',
            locked: undefined, ...filter,
        };

        const creature = this.get_Creature();

        return this.characterService.skills(creature, name, filter)
            .filter(skill =>
                skill.name.includes('Lore') ?
                    skill.level(creature, this.characterService, creature.level) :
                    true,
            )
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.character();
    }

    get_Creature() {
        return this.characterService.creatureFromType(this.creature);
    }

    have_Feat(name: string) {
        return this.characterService.characterFeatsTaken(1, this.characterService.character().level, { featName: name }).length;
    }

    get_Activities(name = '') {
        return this.activitiesService.activities(name);
    }

    get_OwnedActivities() {
        const activities: Array<ActivityGain | ItemActivity> = [];
        const unique: Array<string> = [];

        if (this.get_Character().settings.showSkillActivities) {
            this.characterService.creatureOwnedActivities(this.get_Creature()).forEach(activity => {
                activity.originalActivity(this.activitiesService)?.effectiveCooldown({ creature: this.get_Creature() }, { characterService: this.characterService, effectsService: this.effectsService });

                if (!unique.includes(activity.name)) {
                    unique.push(activity.name);
                    activities.push(activity);
                }
            });
        }

        return activities;
    }

    get_SkillActivities(activities: Array<ActivityGain | ItemActivity>, skillName: string) {
        //Filter activities whose showonSkill or whose original activity's showonSkill includes this skill's name.
        return activities.filter(activity => (activity.originalActivity(this.activitiesService)?.showonSkill || '').toLowerCase().includes(skillName.toLowerCase()));
    }

    get_Senses() {
        return this.characterService.creatureSenses(this.get_Creature(), undefined, true);
    }

    get_Speeds() {
        const speeds: Array<Speed> = this.characterService.creatureSpeeds(this.get_Creature());

        if (['Character', 'Companion'].includes(this.get_Creature().type)) {
            (this.get_Creature() as Character).class?.ancestry?.speeds?.forEach(speed => {
                speeds.push(new Speed(speed.name));
            });
        }

        //We don't process the values yet - for now we just collect all Speeds that are mentioned in effects.
        // Since we pick up every effect that includes "Speed", but we don't want "Ignore Circumstance Penalties To Speed" to show up, we filter out "Ignore".
        const speedEffects = this.effectsService.get_Effects(this.creature).all
            .filter(effect =>
                effect.apply &&
                !effect.toggle &&
                effect.target.toLowerCase().includes('speed') &&
                effect.target.toLowerCase() != 'speed' &&
                !effect.target.toLowerCase().includes('ignore'));

        speedEffects.forEach(effect => {
            if (!speeds.some(speed => speed.name == effect.target)) {
                speeds.push(new Speed(effect.target));
            }
        });

        //Remove any duplicates for display
        const uniqueSpeeds: Array<Speed> = [];

        speeds.forEach(speed => {
            if (!uniqueSpeeds.find(uniqueSpeed => uniqueSpeed.name == speed.name)) {
                uniqueSpeeds.push(speed);
            }
        });

        return uniqueSpeeds.filter(speed => speed.value(this.get_Creature(), this.characterService, this.effectsService).result != 0);
    }

    get_SkillChoices() {
        if (this.creature == 'Character') {
            const character = (this.get_Creature() as Character);
            const choices: Array<SkillChoice> = [];

            character.class.levels.filter(level => level.number <= character.level).forEach(level => {
                choices.push(...level.skillChoices.filter(choice => choice.showOnSheet));
            });

            return choices;
        }
    }

    get_SenseDesc(sense: string) {
        switch (sense) {
            case 'Darkvision':
                return 'You can see in darkness and dim light just as well as you can see in bright light, though your vision in darkness is in black and white.';
            case 'Greater Darkvision':
                return 'You can see in darkness and dim light just as well as you can see in bright light, though your vision in darkness is in black and white. Some forms of magical darkness, such as a 4th-level darkness spell, block normal darkvision. A creature with greater darkvision, however, can see through even these forms of magical darkness.';
            case 'Low-Light Vision':
                return 'You can see in dim light as though it were bright light, and you ignore the concealed condition due to dim light.';
            default:
                if (sense.includes('Scent')) {
                    return 'You can use your sense of smell to determine the location of a creature, but it remains hidden.';
                }

                if (sense.includes('Tremorsense')) {
                    return 'You can feel the vibrations through a solid surface caused by movement.';
                }

                return '';
        }
    }

    public still_loading(): boolean {
        return this.skillsService.still_loading() || this.characterService.stillLoading();
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['skills', 'alls', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['skills', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}

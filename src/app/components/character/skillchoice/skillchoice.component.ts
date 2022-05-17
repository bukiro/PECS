import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Skill } from 'src/app/classes/Skill';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { SkillLevelName } from 'src/libs/shared/util/skillUtils';

@Component({
    selector: 'app-skillchoice',
    templateUrl: './skillchoice.component.html',
    styleUrls: ['./skillchoice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillchoiceComponent implements OnInit, OnDestroy {

    @Input()
    choice: SkillChoice;
    @Input()
    showChoice = '';
    @Output()
    showSkillChoiceMessage = new EventEmitter<{ name: string; levelNumber: number; choice: SkillChoice }>();
    @Input()
    levelNumber = 0;
    @Input()
    excludeTemporary = false;
    @Input()
    showTitle = true;
    @Input()
    showContent = true;
    @Input()
    tileMode = false;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
    ) { }

    toggle_List(name = '') {
        if (this.showChoice == name || name == '') {
            this.showChoice = '';
            this.showSkillChoiceMessage.emit({ name: this.showChoice, levelNumber: 0, choice: null });
        } else {
            this.showChoice = name;
            this.showSkillChoiceMessage.emit({ name: this.showChoice, levelNumber: this.levelNumber, choice: this.choice });
        }
    }

    get_ShowChoice() {
        return this.showChoice;
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_TileMode() {
        return this.tileMode;
    }

    get_Character() {
        return this.characterService.character();
    }

    get_ButtonTitle(maxAvailable: number) {
        let title = 'Skill ';

        if (this.choice.maxRank == 2) {
            title += 'Training';
        } else {
            title += 'Increase';
        }

        title += ` (${ this.choice.source })`;

        if (maxAvailable > 1) {
            title += `: ${ this.choice.increases.length }/${ maxAvailable }`;
        } else {
            if (this.choice.increases.length) {
                title += `: ${ this.choice.increases[0].name }`;
            }
        }

        return title;
    }

    get_Abilities(name = '') {
        return this.characterService.abilities(name);
    }

    get_Skills(name = '', filter: { type?: string; locked?: boolean } = {}) {
        filter = {
            type: '',
            locked: undefined, ...filter,
        };

        return this.characterService.skills(this.get_Character(), name, filter);
    }

    get_SkillLevel(skill: Skill) {
        return skill.level(this.get_Character(), this.characterService, this.levelNumber, true);
    }

    get_SkillLevelName(skillLevel: number, shortForm = false) {
        return SkillLevelName(skillLevel, { shortForm });
    }

    get_INT(levelNumber: number) {
        if (!levelNumber) {
            return 0;
        }

        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        const intelligence: number = this.get_Abilities('Intelligence')[0].baseValue(this.get_Character(), this.characterService, levelNumber).result;
        const INT: number = Math.floor((intelligence - 10) / 2);

        return INT;
    }

    get_SkillINTBonus() {
        //Allow INT more skills if INT has been raised since the last level.
        const levelNumber = parseInt(this.choice.id.split('-')[0], 10);

        if (this.choice.source == 'Intelligence') {
            return this.get_INT(levelNumber) - this.get_INT(levelNumber - 1);
        } else {
            return 0;
        }
    }

    get_Available() {
        return this.choice.available + this.get_SkillINTBonus();
    }

    get_AvailableSkills(choice: SkillChoice, levelNumber: number, maxAvailable: number) {
        let skills = this.get_Skills('', { type: choice.type, locked: false });

        if (choice.filter.length) {
            //Only filter the choice if enough of the filtered skills can be raised.
            if (choice.filter.map(skillName => this.get_Skills(skillName)[0]).filter(skill => skill && !this.cannotIncrease(skill, levelNumber, choice).length).length >= maxAvailable) {
                skills = skills.filter(skill => choice.filter.includes(skill.name));
            }
        }

        if (choice.minRank) {
            const character = this.get_Character();

            skills = skills.filter(skill => skill.level(character, this.characterService, levelNumber) >= choice.minRank);
        }

        if (skills.length) {
            const showOtherOptions = this.get_Character().settings.showOtherOptions;

            return skills
                .filter(skill => (
                    this.skillIncreasedByThis(skill, choice) ||
                    (
                        (
                            showOtherOptions ||
                            choice.increases.length < maxAvailable
                        ) &&
                        //Don't show unavailable skills if this choice is visible on the character sheet.
                        (choice.showOnSheet ? !this.cannotIncrease(skill, levelNumber, choice).length : true)
                    )
                ))
                .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
        }
    }

    someIllegal(choice: SkillChoice) {
        let anytrue = 0;

        choice.increases.forEach(increase => {
            let levelNumber = parseInt(choice.id.split('-')[0], 10);

            //Temporary choices are compared to the character level, not their own.
            if (choice.showOnSheet) {
                levelNumber = this.get_Character().level;
            }

            if (!this.get_Skills(increase.name)[0].isLegal(this.get_Character(), this.characterService, levelNumber, choice.maxRank)) {
                if (!increase.locked) {
                    this.get_Character().increaseSkill(this.characterService, increase.name, false, choice, increase.locked);
                    this.refreshService.process_ToChange();
                } else {
                    anytrue += 1;
                }
            }
        });

        return anytrue;
    }

    cannotIncrease(skill: Skill, levelNumber: number, choice: SkillChoice) {
        //Returns a string of reasons why the skill cannot be increased, or []. Test the length of the return if you need a boolean.
        const maxRank: number = choice.maxRank;
        const reasons: Array<string> = [];

        //The skill may have been increased by the same source, but as a fixed rule.
        if (choice.increases.some(increase => increase.name == skill.name && increase.locked)) {
            const locked = 'Fixed increase.';

            reasons.push(locked);
        }

        //If this skill was trained by a feat on a higher level, it can't be raised on this level.
        //This prevents losing the feat bonus or raising the skill too high.
        //An exception is made for Additional Lore and Gnome Obsession, which can be raised on Level 2/3, 7 and 15 no matter when you learned them.
        const allIncreases = this.get_SkillIncreases(levelNumber + 1, 20, skill.name, '', '', undefined, true);

        if (allIncreases.length) {
            if (allIncreases[0].locked && allIncreases[0].source.includes('Feat: ') && !['Feat: Additional Lore', 'Feat: Gnome Obsession'].includes(allIncreases[0].source)) {
                const trainedOnHigherLevelByFeat = `Trained on a higher level by ${ allIncreases[0].source }.`;

                reasons.push(trainedOnHigherLevelByFeat);
            }

            //If this is a temporary choice, and the character has raised the skill higher than the temporary choice allows, the choice is illegal.
            if (choice.showOnSheet && allIncreases.length * 2 > choice.maxRank) {
                const trainedOnHigherLevel = 'Trained on a higher level.';

                reasons.push(trainedOnHigherLevel);
            }
        }

        //Check if this skill cannot be raised higher at this level, or if this method only allows a certain rank
        // (e.g. for Feats that TRAIN a skill)
        //This is only relevant if you haven't raised the skill on this level yet.
        //If you have, we don't want to hear that it couldn't be raised again right away
        let cannotIncreaseHigher = '';

        //You can never raise a skill higher than Legendary (8)
        if (skill.level(this.get_Character(), this.characterService, levelNumber, true) == 8 && !this.skillIncreasedByThis(skill, choice)) {
            cannotIncreaseHigher = 'Cannot increase any higher.';
            reasons.push(cannotIncreaseHigher);
        } else if (!skill.canIncrease(this.get_Character(), this.characterService, levelNumber, maxRank) && !this.skillIncreasedByThis(skill, choice)) {
            if (!skill.canIncrease(this.get_Character(), this.characterService, levelNumber)) {
                cannotIncreaseHigher = 'Highest rank at this level.';
            } else {
                if (choice.maxRank == 2) {
                    cannotIncreaseHigher = 'Already trained.';
                } else {
                    cannotIncreaseHigher = 'Highest rank for this increase.';
                }
            }

            reasons.push(cannotIncreaseHigher);
        }

        //You can never raise Bardic Lore
        if (skill.name == 'Lore: Bardic') {
            reasons.push('Cannot increase with skill training.');
        }

        return reasons;
    }

    skillIncreasedByThis(skill: Skill, choice: SkillChoice) {
        return choice.increases.filter(increase => increase.name == skill.name).length;
    }

    skillLockedByThis(skill: Skill, choice: SkillChoice) {
        return choice.increases.filter(increase => increase.name == skill.name && increase.locked).length;
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source = '', sourceId = '', locked: boolean = undefined, excludeTemporary = false) {
        return this.get_Character().skillIncreases(this.characterService, minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked, excludeTemporary);
    }

    on_SkillIncrease(skillName: string, event: Event, choice: SkillChoice, locked = false, maxAvailable: number) {
        const boost = (event.target as HTMLInputElement).checked;

        if (boost && this.get_Character().settings.autoCloseChoices && (choice.increases.length == maxAvailable - 1)) { this.toggle_List(''); }

        this.get_Character().increaseSkill(this.characterService, skillName, boost, choice, locked);
        this.refreshService.process_ToChange();
    }

    remove_BonusSkillChoice(choice: SkillChoice) {
        choice.increases.forEach(increase => {
            this.get_Character().increaseSkill(this.characterService, increase.name, false, choice, false);
        });
        this.get_Character().removeSkillChoice(choice);
        this.toggle_List('');
        this.refreshService.process_ToChange();
    }

    public ngOnInit(): void {
        if (!this.levelNumber) {
            this.levelNumber = this.get_Character().level;
        }

        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['skillchoices', 'all', 'character'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'character' && ['skillchoices', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}

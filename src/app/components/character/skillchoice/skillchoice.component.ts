import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Skill } from 'src/app/classes/Skill';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { SkillLevelName } from 'src/libs/shared/util/skillUtils';
import { Trackers } from 'src/libs/shared/util/trackers';
import { skillLevelBaseStep, SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { Character } from 'src/app/classes/Character';
import { AbilityModFromAbilityValue } from 'src/libs/shared/util/abilityUtils';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { CharacterSkillIncreaseService } from 'src/app/character-creation/services/character-skill-increase/character-skill-increase.service';

interface SkillChoiceParameters {
    listId: string;
    allowedIncreases: number;
    buttonTitle: string;
    cleared: boolean;
}

interface SkillParameters {
    skill: Skill;
    increased: boolean;
    skillLevel: number;
    checked: boolean;
    disabled: boolean;
}

@Component({
    selector: 'app-skillchoice',
    templateUrl: './skillchoice.component.html',
    styleUrls: ['./skillchoice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillchoiceComponent implements OnInit, OnDestroy {

    @Input()
    public choice: SkillChoice;
    @Input()
    public showChoice = '';
    @Input()
    public levelNumber = 0;
    @Input()
    public excludeTemporary = false;
    @Input()
    public showTitle = true;
    @Input()
    public showContent = true;
    @Input()
    public tileMode = false;
    @Output()
    public readonly showSkillChoiceMessage = new EventEmitter<{ name: string; levelNumber: number; choice: SkillChoice }>();

    public areAnyIncreasesIllegal = false;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        public trackers: Trackers,
    ) { }

    public get isTileMode(): boolean {
        return this.tileMode;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public toggleShownList(name = ''): void {
        if (!name || this.showChoice === name) {
            this.showChoice = '';
            this.showSkillChoiceMessage.emit({ name: this.showChoice, levelNumber: 0, choice: null });
        } else {
            this.showChoice = name;
            this.showSkillChoiceMessage.emit({ name: this.showChoice, levelNumber: this.levelNumber, choice: this.choice });
        }
    }

    public shownChoice(): string {
        return this.showChoice;
    }

    public gridIconTitle(allowedIncreases: number): string {
        if (this.choice.increases.length && allowedIncreases > 0) {
            if (allowedIncreases === 1) {
                return this.choice.increases[0].name;
            } else {
                return this.choice.increases.length.toString();
            }
        }

        return '';
    }

    public skillLevelName(skillLevel: number, shortForm = false): string {
        return SkillLevelName(skillLevel, { shortForm });
    }

    public skillChoiceParameters(): SkillChoiceParameters {
        this._removeIllegalIncreases();

        const listId = this.choice.id;
        const allowedIncreases = this._allowedIncreasesAmount();
        const buttonTitle = this._buttonTitle(allowedIncreases);
        const isCleared = this.choice.increases.length === allowedIncreases;

        return {
            listId,
            allowedIncreases,
            buttonTitle,
            cleared: isCleared,
        };
    }

    public availableSkillsParameters(choice: SkillChoice, levelNumber: number, allowedIncreases: number): Array<SkillParameters> {
        const character = this.character;

        return this._availableSkills(choice, levelNumber, allowedIncreases)
            .map(skill => {
                const isIncreasedByThisChoice = this._skillIncreasedByThisChoice(skill, choice);
                const skillLevel = this._skillValuesService.level(skill, character, this.levelNumber, true);
                const shouldBeChecked = isIncreasedByThisChoice || (skillLevel >= choice.maxRank);
                const shouldBeDisabled =
                    !!this._skillLockedByThisChoice(skill, choice) ||
                    (
                        (
                            (choice.increases.length >= allowedIncreases) ||
                            !!this.cannotIncreaseSkill(skill, levelNumber, choice).length
                        ) && !isIncreasedByThisChoice
                    );

                return {
                    skill,
                    increased: isIncreasedByThisChoice,
                    skillLevel,
                    checked: shouldBeChecked,
                    disabled: shouldBeDisabled,
                };
            });
    }

    public skillTooHigh(skill: Skill): boolean {
        const character = this.character;

        return !this._skillValuesService.isSkillLegal(skill, character, this.levelNumber) ||
            (
                !this._skillValuesService.isSkillLegal(skill, character, this.levelNumber, this.choice.maxRank) &&
                this._skillIncreasedByThisChoice(skill, this.choice)
            );
    }

    public cannotIncreaseSkill(skill: Skill, levelNumber: number, choice: SkillChoice): Array<string> {
        //Returns a string of reasons why the skill cannot be increased, or []. Test the length of the return if you need a boolean.
        const maxRank: number = choice.maxRank;
        const reasons: Array<string> = [];

        //The skill may have been increased by the same source, but as a fixed rule.
        if (choice.increases.some(increase => increase.name === skill.name && increase.locked)) {
            const locked = 'Fixed increase.';

            reasons.push(locked);
        }

        // If this skill was trained by a feat on a higher level, it can't be raised on this level.
        // This prevents losing the feat bonus or raising the skill too high.
        // An exception is made for Additional Lore and Gnome Obsession,
        // which can be raised on Level 2/3, 7 and 15 no matter when you learned them.
        const allIncreases =
            this.character.skillIncreases(
                levelNumber + 1,
                Defaults.maxCharacterLevel,
                skill.name,
                '',
                '',
                undefined,
                true,
            );

        if (allIncreases.length) {
            if (
                allIncreases[0].locked &&
                allIncreases[0].source.includes('Feat: ') &&
                !['Feat: Additional Lore', 'Feat: Gnome Obsession'].includes(allIncreases[0].source)
            ) {
                const trainedOnHigherLevelByFeat = `Trained on a higher level by ${ allIncreases[0].source }.`;

                reasons.push(trainedOnHigherLevelByFeat);
            }

            // If this is a temporary choice, and the character has raised the skill higher
            // than the temporary choice allows, the choice is illegal.
            if (choice.showOnSheet && allIncreases.length * skillLevelBaseStep > choice.maxRank) {
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
        if (
            this._skillValuesService.level(skill, this.character, levelNumber, true) === SkillLevels.Legendary &&
            !this._skillIncreasedByThisChoice(skill, choice)
        ) {
            cannotIncreaseHigher = 'Cannot increase any higher.';
            reasons.push(cannotIncreaseHigher);
        } else if (
            !this._skillValuesService.canIncreaseSkill(skill, this.character, levelNumber, maxRank) &&
            !this._skillIncreasedByThisChoice(skill, choice)
        ) {
            if (!this._skillValuesService.canIncreaseSkill(skill, this.character, levelNumber)) {
                cannotIncreaseHigher = 'Highest rank at this level.';
            } else {
                if (choice.maxRank === SkillLevels.Trained) {
                    cannotIncreaseHigher = 'Already trained.';
                } else {
                    cannotIncreaseHigher = 'Highest rank for this increase.';
                }
            }

            reasons.push(cannotIncreaseHigher);
        }

        //You can never raise Bardic Lore
        if (skill.name === 'Lore: Bardic') {
            reasons.push('Cannot increase with skill training.');
        }

        return reasons;
    }

    public onSkillIncrease(skillName: string, event: Event, choice: SkillChoice, locked = false, maxAvailable: number): void {
        const hasBeenIncreased = (event.target as HTMLInputElement).checked;

        if (
            hasBeenIncreased &&
            this.character.settings.autoCloseChoices &&
            (choice.increases.length === maxAvailable - 1)
        ) { this.toggleShownList(); }

        this._characterSkillIncreaseService.increaseSkill(skillName, hasBeenIncreased, choice, locked);
        this._refreshService.processPreparedChanges();
    }

    public removeBonusSkillChoice(choice: SkillChoice): void {
        choice.increases.forEach(increase => {
            this._characterSkillIncreaseService.increaseSkill(increase.name, false, choice, false);
        });

        this.character.classLevelFromNumber(this.choice.insertLevel || this.levelNumber)?.removeSkillChoice(choice);

        this.toggleShownList();
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        if (!this.levelNumber) {
            this.levelNumber = this.character.level;
        }

        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['skillchoices', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['skillchoices', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _skills(name = '', filter: { type?: string; locked?: boolean } = {}): Array<Skill> {
        filter = {
            type: '',
            locked: undefined, ...filter,
        };

        return this._characterService.skills(this.character, name, filter);
    }

    private _buttonTitle(allowedIncreases: number): string {
        let title = 'Skill ';

        if (this.choice.maxRank === SkillLevels.Trained) {
            title += 'Training';
        } else {
            title += 'Increase';
        }

        title += ` (${ this.choice.source })`;

        if (allowedIncreases > 1) {
            title += `: ${ this.choice.increases.length }/${ allowedIncreases }`;
        } else {
            if (this.choice.increases.length) {
                title += `: ${ this.choice.increases[0].name }`;
            }
        }

        return title;
    }

    private _intelligenceModifier(levelNumber: number): number {
        if (levelNumber <= 0) {
            return 0;
        }

        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        const intelligence: number =
            this._abilityValuesService.baseValue('Intelligence', this.character, levelNumber).result;
        const INT: number = AbilityModFromAbilityValue(intelligence);

        return INT;
    }

    private _intelligenceBonusToAllowedIncreases(): number {
        //Allow INT more skills if INT has been raised since the last level.
        const levelNumber = parseInt(this.choice.id.split('-')[0], 10);

        if (this.choice.source === 'Intelligence') {
            return this._intelligenceModifier(levelNumber) - this._intelligenceModifier(levelNumber - 1);
        } else {
            return 0;
        }
    }

    private _allowedIncreasesAmount(): number {
        return this.choice.available + this._intelligenceBonusToAllowedIncreases();
    }

    private _removeIllegalIncreases(): void {
        let areAnyLockedIncreasesIllegal = false;

        this.choice.increases.forEach(increase => {
            let levelNumber = parseInt(this.choice.id.split('-')[0], 10);

            //Temporary choices are compared to the character level, not their own.
            if (this.choice.showOnSheet) {
                levelNumber = this.character.level;
            }

            if (!this._skillValuesService.isSkillLegal(increase.name, this.character, levelNumber, this.choice.maxRank)) {
                if (!increase.locked) {
                    this._characterSkillIncreaseService.increaseSkill(increase.name, false, this.choice, increase.locked);
                    this._refreshService.processPreparedChanges();
                } else {
                    areAnyLockedIncreasesIllegal = true;
                }
            }
        });

        this.areAnyIncreasesIllegal = areAnyLockedIncreasesIllegal;
    }

    private _availableSkills(choice: SkillChoice, levelNumber: number, maxAvailable: number): Array<Skill> {
        let skills = this._skills('', { type: choice.type, locked: false });

        if (choice.filter.length) {
            //Only filter the choice if enough of the filtered skills can be raised.
            if (
                choice.filter
                    .map(skillName => this._skills(skillName)[0])
                    .filter(skill => skill && !this.cannotIncreaseSkill(skill, levelNumber, choice).length)
                    .length >= maxAvailable
            ) {
                skills = skills.filter(skill => choice.filter.includes(skill.name));
            }
        }

        if (choice.minRank) {
            const character = this.character;

            skills = skills.filter(skill =>
                this._skillValuesService.level(skill, character, levelNumber) >= choice.minRank,
            );
        }

        if (skills.length) {
            const shouldShowOtherOptions = this.character.settings.showOtherOptions;

            return skills
                .filter(skill => (
                    this._skillIncreasedByThisChoice(skill, choice) ||
                    (
                        (
                            shouldShowOtherOptions ||
                            choice.increases.length < maxAvailable
                        ) &&
                        //Don't show unavailable skills if this choice is visible on the character sheet.
                        (choice.showOnSheet ? !this.cannotIncreaseSkill(skill, levelNumber, choice).length : true)
                    )
                ))
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        }
    }

    private _skillIncreasedByThisChoice(skill: Skill, choice: SkillChoice): boolean {
        return !!choice.increases.filter(increase => increase.name === skill.name).length;
    }

    private _skillLockedByThisChoice(skill: Skill, choice: SkillChoice): boolean {
        return !!choice.increases.filter(increase => increase.name === skill.name && increase.locked).length;
    }

}

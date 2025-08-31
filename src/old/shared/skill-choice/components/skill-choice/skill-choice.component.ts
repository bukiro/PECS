import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Observable, map, switchMap, combineLatest, of } from 'rxjs';
import { SkillChoice } from 'src/app/classes/character-creation/skill-choice';
import { Character } from 'src/app/classes/creatures/character/character';
import { Skill } from 'src/app/classes/skills/skill';
import { CharacterSkillIncreaseService } from 'src/libs/character-creation/services/character-skill-increase/character-skill-increase.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { skillLevelBaseStep, SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { abilityModFromAbilityValue } from 'src/libs/shared/util/ability-base-value-utils';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { skillLevelName } from 'src/libs/shared/util/skill-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { NgbTooltip, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { CommonModule } from '@angular/common';

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
    cannotIncreaseReasons: Array<string>;
}

@Component({
    selector: 'app-skill-choice',
    templateUrl: './skill-choice.component.html',
    styleUrls: ['./skill-choice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbTooltip,
        NgbPopover,

        GridIconComponent,
    ],
})
export class SkillChoiceComponent extends TrackByMixin(BaseClass) {

    @Input()
    public choice!: SkillChoice;
    @Input()
    public showChoice = '';
    @Input()
    public levelNumber = 0;
    @Input()
    public excludeTemporary?: boolean;
    @Input()
    public showTitle = true;
    @Input()
    public showContent = true;
    @Input()
    public isTileMode = false;
    @Output()
    public readonly showSkillChoiceMessage = new EventEmitter<{ name: string; levelNumber: number; choice?: SkillChoice }>();

    public areAnyIncreasesIllegal = false;

    constructor(
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _skillsDataService: SkillsDataService,
    ) {
        super();
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public toggleShownList(name = ''): void {
        if (!name || this.showChoice === name) {
            this.showChoice = '';
            this.showSkillChoiceMessage.emit({ name: this.showChoice, levelNumber: 0 });
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
                return this.choice.increases[0]?.name ?? '';
            } else {
                return this.choice.increases.length.toString();
            }
        }

        return '';
    }

    public skillLevelName(skillLevel: number, shortForm = false): string {
        return skillLevelName(skillLevel, { shortForm });
    }

    public skillChoiceParameters$(): Observable<SkillChoiceParameters> {
        this._removeIllegalIncreases();

        const listId = this.choice.id;

        return this._allowedIncreasesAmount$()
            .pipe(
                map(allowedIncreases => {
                    const buttonTitle = this._buttonTitle(allowedIncreases);
                    const isCleared = this.choice.increases.length === allowedIncreases;

                    return {
                        listId,
                        allowedIncreases,
                        buttonTitle,
                        cleared: isCleared,
                    };
                }),
            );
    }

    public availableSkillsParameters$(
        choice: SkillChoice,
        levelNumber: number,
        allowedIncreases: number,
    ): Observable<Array<SkillParameters>> {
        const character = this.character;

        return this._availableSkills$(choice, levelNumber, allowedIncreases)
            .pipe(
                switchMap(skills => emptySafeCombineLatest(
                    skills.map(skill => combineLatest([
                        this._skillValuesService.level$(skill, character, this.levelNumber, { excludeTemporary: true }),
                        this.cannotIncreaseSkill$(skill, levelNumber, choice),
                    ])
                        .pipe(
                            map(([skillLevel, cannotIncreaseReasons]) => {
                                const isIncreasedByThisChoice = this._skillIncreasedByThisChoice(skill, choice);
                                const shouldBeChecked = isIncreasedByThisChoice || (skillLevel >= choice.maxRank);
                                const shouldBeDisabled =
                                    !!this._skillLockedByThisChoice(skill, choice)
                                    || (
                                        (
                                            (choice.increases.length >= allowedIncreases)
                                            || !!cannotIncreaseReasons.length
                                        )
                                        && !isIncreasedByThisChoice
                                    );

                                return {
                                    skill,
                                    increased: isIncreasedByThisChoice,
                                    skillLevel,
                                    checked: shouldBeChecked,
                                    disabled: shouldBeDisabled,
                                    cannotIncreaseReasons,
                                };
                            }),
                        ),
                    )),
                ),
            );
    }

    public skillTooHigh(skill: Skill): boolean {
        const character = this.character;

        return !this._skillValuesService.isSkillLegal$(skill, character, this.levelNumber) ||
            (
                !this._skillValuesService.isSkillLegal$(skill, character, this.levelNumber, this.choice.maxRank) &&
                this._skillIncreasedByThisChoice(skill, this.choice)
            );
    }

    public cannotIncreaseSkill$(skill: Skill, levelNumber: number, choice: SkillChoice): Observable<Array<string>> {
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
            this.character.skillIncreases$$(
                levelNumber + 1,
                Defaults.maxCharacterLevel,
                skill.name,
                '',
                '',
                undefined,
                true,
            );

        if (allIncreases.length) {
            const firstIncrease = allIncreases[0];

            if (
                firstIncrease &&
                firstIncrease.locked &&
                firstIncrease.source.includes('Feat: ') &&
                !['Feat: Additional Lore', 'Feat: Gnome Obsession'].includes(firstIncrease.source)
            ) {
                const trainedOnHigherLevelByFeat = `Trained on a higher level by ${ firstIncrease.source }.`;

                reasons.push(trainedOnHigherLevelByFeat);
            }

            // If this is a temporary choice, and the character has raised the skill higher
            // than the temporary choice allows, the choice is illegal.
            if (choice.showOnSheet && allIncreases.length * skillLevelBaseStep > choice.maxRank) {
                const trainedOnHigherLevel = 'Trained on a higher level.';

                reasons.push(trainedOnHigherLevel);
            }
        }

        //You can never raise Bardic Lore
        if (skill.name === 'Lore: Bardic') {
            reasons.push('Cannot increase with skill training.');
        }

        return combineLatest([
            this._skillValuesService.level$(skill, this.character, levelNumber, { excludeTemporary: true }),
            this._skillValuesService.canIncreaseSkill$(skill, this.character, levelNumber, maxRank),
            this._skillValuesService.canIncreaseSkill$(skill, this.character, levelNumber),
        ])
            .pipe(
                map(([skillLevel, canIncreaseWithMaxRank, canIncreaseAtLevel]) => {
                    // Skip these checks if the skill was increased by this choice. It shouldn't become illegal right after taking it.
                    if (!this._skillIncreasedByThisChoice(skill, choice)) {
                        //Check if this skill cannot be raised higher at this level, or if this method only allows a certain rank
                        // (e.g. for Feats that TRAIN a skill)
                        //This is only relevant if you haven't raised the skill on this level yet.
                        //If you have, we don't want to hear that it couldn't be raised again right away
                        let cannotIncreaseHigher = '';

                        //You can never raise a skill higher than Legendary (8)
                        if (
                            skillLevel === SkillLevels.Legendary
                        ) {
                            cannotIncreaseHigher = 'Cannot increase any higher.';
                        } else if (!canIncreaseAtLevel) {
                            cannotIncreaseHigher = 'Highest rank at this level.';
                        } else if (!canIncreaseWithMaxRank) {
                            if (choice.maxRank === SkillLevels.Trained) {
                                cannotIncreaseHigher = 'Already trained.';
                            } else {
                                cannotIncreaseHigher = 'Highest rank for this increase.';
                            }
                        }

                        if (cannotIncreaseHigher) {
                            return reasons.concat(cannotIncreaseHigher);
                        }
                    }

                    return reasons;
                }),
            );
    }

    public onSkillIncrease(skillName: string, event: Event, choice: SkillChoice, locked = false, maxAvailable: number): void {
        const hasBeenIncreased = (event.target as HTMLInputElement).checked;

        if (
            hasBeenIncreased &&
            SettingsService.settings.autoCloseChoices &&
            (choice.increases.length === maxAvailable - 1)
        ) { this.toggleShownList(); }

        this._characterSkillIncreaseService.increaseSkill(skillName, hasBeenIncreased, choice, locked);
    }

    public removeBonusSkillChoice(choice: SkillChoice): void {
        choice.increases.forEach(increase => {
            this._characterSkillIncreaseService.increaseSkill(increase.name, false, choice, false);
        });

        this.character.classLevelFromNumber$$(this.choice.insertLevel || this.levelNumber)?.removeSkillChoice(choice);

        this.toggleShownList();
    }

    private _skills$(
        name = '',
        filter?: { type?: string; locked?: boolean },
        options?: { noSubstitutions?: boolean },
    ): Observable<Array<Skill>> {
        filter = {
            type: '',
            locked: undefined, ...filter,
        };

        return CreatureService.character.customSkills.values$
            .pipe(
                map(customSkills => this._skillsDataService.skills(customSkills, name, filter, options)),
            );
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
                title += `: ${ this.choice.increases[0]?.name }`;
            }
        }

        return title;
    }

    private _intelligenceModifier$(levelNumber: number): Observable<number> {
        if (levelNumber <= 0) {
            return of(0);
        }

        return this._abilityValuesService.baseValue$$('Intelligence', this.character, levelNumber)
            .pipe(
                map(intelligence => abilityModFromAbilityValue(intelligence.result)),
            );
    }

    private _intelligenceBonusToAllowedIncreases$(): Observable<number> {
        //Allow INT more skills if INT has been raised since the last level.
        const levelNumber = parseInt(this.choice.id.split('-')[0] ?? '0', 10);

        if (!levelNumber) {
            return of(0);
        }

        if (this.choice.source === 'Intelligence') {
            return combineLatest([
                this._intelligenceModifier$(levelNumber),
                this._intelligenceModifier$(levelNumber - 1),
            ])
                .pipe(
                    map(([intNow, intPrev]) => Math.max(0, intNow - intPrev)),
                );
        } else {
            return of(0);
        }
    }

    private _allowedIncreasesAmount$(): Observable<number> {
        return this._intelligenceBonusToAllowedIncreases$()
            .pipe(
                map(intBonus => intBonus + this.choice.available),
            );
    }

    private _removeIllegalIncreases(): void {
        let areAnyLockedIncreasesIllegal = false;

        this.choice.increases.forEach(increase => {
            let levelNumber = parseInt(this.choice.id.split('-')[0] ?? '', 10);

            //Temporary choices are compared to the character level, not their own.
            if (this.choice.showOnSheet) {
                levelNumber = this.character.level;
            }

            if (!this._skillValuesService.isSkillLegal$(increase.name, this.character, levelNumber, this.choice.maxRank)) {
                if (!increase.locked) {
                    this._characterSkillIncreaseService.increaseSkill(increase.name, false, this.choice, increase.locked);
                } else {
                    areAnyLockedIncreasesIllegal = true;
                }
            }
        });

        this.areAnyIncreasesIllegal = areAnyLockedIncreasesIllegal;
    }

    private _availableSkills$(choice: SkillChoice, levelNumber: number, maxAvailable: number): Observable<Array<Skill>> {
        return combineLatest([
            this._skills$('', { type: choice.type, locked: false }),
            SettingsService.settings.showOtherOptions$,
        ])
            .pipe(
                switchMap(([skills, showOtherOptions]) =>
                    emptySafeCombineLatest(skills.map(skill =>
                        // If the choice has a minRank, only keep those skills with that rank or higher.
                        choice.minRank
                            ? this._skillValuesService.level$(skill, CreatureService.character, levelNumber)
                                .pipe(
                                    map(skillLevel =>
                                        (skillLevel >= choice.minRank)
                                            ? skill
                                            : undefined,
                                    ),
                                )
                            : of(skill),
                    ))
                        .pipe(
                            map(allowedSkills => ({ allowedSkills, showOtherOptions })),
                        ),
                ),
                map(({ allowedSkills, showOtherOptions }) => ({
                    skills: allowedSkills.filter((skill): skill is Skill => !!skill),
                    showOtherOptions,
                })),
                switchMap(({ skills, showOtherOptions }) =>
                    // For each skill, fetch whether it can be increased in this choice.
                    emptySafeCombineLatest(
                        skills
                            .map(skill => this.cannotIncreaseSkill$(skill, levelNumber, choice)
                                .pipe(
                                    map(cannotIncreaseReasons => ({ skill, cannotIncreaseReasons })),
                                )),
                    )
                        .pipe(
                            map(skillSets => ({ skillSets, showOtherOptions })),
                        ),
                ),
                map(({ skillSets, showOtherOptions }) => {
                    // If the choice has a filter, verify that the filtered skills that can be raised are
                    // at least as many as the available number.
                    // If that is the case, continue with only the filtered skills.
                    // If not, allow all skills. Pathfinder generally allows you to train any skill if the one you are
                    // supposed to take is already trained.
                    if (choice.filter.length) {
                        const filteredSkillSets = skillSets
                            .filter(skillSet => stringsIncludeCaseInsensitive(choice.filter, skillSet.skill.name));

                        if (
                            filteredSkillSets
                                .filter(skillSet => !skillSet.cannotIncreaseReasons.length)
                                .length >= maxAvailable
                        ) {
                            return ({ skillSets: filteredSkillSets, showOtherOptions });
                        }
                    }

                    return ({ skillSets, showOtherOptions });
                }),
                map(({ skillSets, showOtherOptions }) => skillSets
                    .filter(skillSet => (
                        this._skillIncreasedByThisChoice(skillSet.skill, choice) ||
                        (
                            (
                                showOtherOptions ||
                                choice.increases.length < maxAvailable
                            ) &&
                            //Don't show unavailable skills if this choice is visible on the character sheet.
                            (choice.showOnSheet ? !skillSet.cannotIncreaseReasons.length : true)
                        )
                    ))
                    .map(skillSet => skillSet.skill)
                    .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    private _skillIncreasedByThisChoice(skill: Skill, choice: SkillChoice): boolean {
        return !!choice.increases.filter(increase => increase.name === skill.name).length;
    }

    private _skillLockedByThisChoice(skill: Skill, choice: SkillChoice): boolean {
        return !!choice.increases.filter(increase => increase.name === skill.name && increase.locked).length;
    }

}

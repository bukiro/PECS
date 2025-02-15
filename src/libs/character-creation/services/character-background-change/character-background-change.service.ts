/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { SkillChoice } from 'src/app/classes/character-creation/skill-choice';
import { Background } from 'src/app/classes/creatures/character/background';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { CharacterSkillIncreaseService } from '../character-skill-increase/character-skill-increase.service';
import { FeatTakingService } from '../feat-taking/feat-taking.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterBackgroundChangeService {

    constructor(
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public changeBackground(background?: Background): void {
        const character = CreatureService.character;

        this._processRemovingOldBackground();

        if (background) {
            character.class.background = background.clone();

            this._processNewBackground();
        } else {
            character.class.background = new Background();
        }
    }

    private _processRemovingOldBackground(): void {
        const character = CreatureService.character;
        const characterClass = character.class;
        const background = characterClass?.background;

        const level = characterClass.levels[1];

        if (background?.name && level) {
            level.skillChoices = level.skillChoices.filter(choice => choice.source !== 'Background');
            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Background');

            //Many feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            level.featChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.feats.forEach(feat => {
                    this._featTakingService.takeFeat(character, undefined, feat.name, false, choice, feat.locked);
                });
            });

            level.featChoices = level.featChoices.filter(choice => choice.source !== 'Background');

            //Remove all Lores
            const oldChoice = level.loreChoices.find(choice => choice.source === 'Background');

            if (oldChoice?.increases.length) {
                this._characterLoreService.removeLore(oldChoice);
            }

            level.loreChoices = level.loreChoices.filter(choice => choice.source !== 'Background');
            //Process skill choices in case any custom skills need to be removed.
            background.skillChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.increases.forEach(increase => {
                    this._characterSkillIncreaseService.processSkillIncrease(increase.name, false, choice);
                });
            });

        }
    }

    private _processNewBackground(): void {
        const character = CreatureService.character;
        const characterClass = character.class;
        const background = characterClass?.background;

        const level = characterClass.levels[1];

        if (background.name && level) {
            level.abilityChoices.push(...background.abilityChoices);
            level.skillChoices.push(...background.skillChoices);
            level.featChoices.push(...background.featChoices);
            level.loreChoices.push(...background.loreChoices);

            //Process the new feat choices.
            level.featChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.feats.forEach(gain => {
                    this._psp.featProcessingService?.processFeat(undefined, true, { creature: character, gain, choice, level });
                });
            });

            //Process the new skill choices in case any new skill needs to be created.
            level.skillChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.increases.forEach(increase => {
                    this._characterSkillIncreaseService.processSkillIncrease(increase.name, true, choice);
                });
            });

            if (background.loreChoices[0]?.loreName) {
                if (this._skillsDataService.skills(
                    character.customSkills,
                    `Lore: ${ background.loreChoices[0].loreName }`,
                    {},
                    { noSubstitutions: true },
                ).length) {
                    const increases =
                        character.skillIncreases$$(
                            1,
                            Defaults.maxCharacterLevel,
                            `Lore: ${ background.loreChoices[0].loreName }`,
                        )
                            .filter(increase =>
                                increase.sourceId.includes('-Lore-'),
                            );

                    if (increases[0]) {
                        const oldChoice = character.class.getLoreChoiceBySourceId(increases[0].sourceId);

                        if (oldChoice?.available === 1) {
                            this._characterLoreService.removeLore(oldChoice);
                        }
                    }
                }

                this._characterLoreService.addLore(background.loreChoices[0]);
            }

            if (background.skillChoices[0]?.increases[0]) {
                const existingIncreases =
                    character.skillIncreases$$(1, 1, background.skillChoices[0].increases[0].name, '');

                if (existingIncreases[0]) {
                    const existingIncrease = existingIncreases[0];
                    const existingSkillChoice: SkillChoice | undefined = characterClass.getSkillChoiceBySourceId(existingIncrease.sourceId);

                    // If you have already trained this skill from another source:
                    // Check if it is a free training (not locked). If so, remove it and reimburse the skill point,
                    // then replace it with the background's.
                    // If it is locked, we better not replace it. Instead, you get a free Background skill increase.
                    if (existingSkillChoice && existingSkillChoice !== background.skillChoices[0]) {
                        if (!existingIncrease.locked) {
                            this._characterSkillIncreaseService.increaseSkill(existingIncrease.name, false, existingSkillChoice, false);
                        } else {
                            background.skillChoices[0].increases.pop();
                            background.skillChoices[0].available = 1;
                        }
                    }
                }
            }
        }
    }

}

import { Injectable } from '@angular/core';
import { Background } from 'src/app/classes/Background';
import { Character } from 'src/app/classes/Character';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { CacheService } from 'src/app/services/cache.service';
import { CharacterService } from 'src/app/services/character.service';
import { FeatsService } from 'src/app/services/feats.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CharacterSkillIncreaseService } from '../character-skill-increase/character-skill-increase.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterBackgroundChangeService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _featsService: FeatsService,
        private readonly _cacheService: CacheService,
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _characterLoreService: CharacterLoreService,
    ) { }

    public changeBackground(background?: Background): void {
        const character = this._characterService.character;

        this._processRemovingOldBackground(character);

        if (background) {
            character.class.background = Object.assign(new Background(), JSON.parse(JSON.stringify(background))).recast();

            this._processNewBackground(character);
        } else {
            character.class.background = new Background();
        }

        this._cacheService.resetCreatureCache(character.typeId);
    }

    private _processRemovingOldBackground(character: Character): void {
        const characterClass = character.class;
        const background = characterClass?.background;

        if (background?.name) {
            const level = characterClass.levels[1];

            level.skillChoices = level.skillChoices.filter(choice => choice.source !== 'Background');
            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Background');

            //Many feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            level.featChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.feats.forEach(gain => {
                    this._featsService.processFeat(character, this._characterService, undefined, gain, choice, level, false);
                });
            });
            level.featChoices = level.featChoices.filter(choice => choice.source !== 'Background');

            //Remove all Lores
            const oldChoices: Array<LoreChoice> = level.loreChoices.filter(choice => choice.source === 'Background');
            const oldChoice = oldChoices[oldChoices.length - 1];

            if (oldChoice.increases.length) {
                this._characterLoreService.removeLore(character, oldChoice);
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

    private _processNewBackground(character: Character): void {
        const characterClass = character.class;
        const background = characterClass?.background;

        if (background.name) {
            const level = characterClass.levels[1];

            level.abilityChoices.push(...background.abilityChoices);
            level.skillChoices.push(...background.skillChoices);
            level.featChoices.push(...background.featChoices);
            level.loreChoices.push(...background.loreChoices);

            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.feats.forEach(gain => {
                    this._featsService.processFeat(character, this._characterService, undefined, gain, choice, level, true);
                });
            });

            //Process the new skill choices in case any new skill needs to be created.
            level.skillChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.increases.forEach(increase => {
                    this._characterSkillIncreaseService.processSkillIncrease(increase.name, true, choice);
                });
            });

            if (background.loreChoices[0].loreName) {
                if (this._characterService.skills(
                    character,
                    `Lore: ${ background.loreChoices[0].loreName }`,
                    {},
                    { noSubstitutions: true },
                ).length) {
                    const increases =
                        character.skillIncreases(
                            1,
                            Defaults.maxCharacterLevel,
                            `Lore: ${ background.loreChoices[0].loreName }`,
                        )
                            .filter(increase =>
                                increase.sourceId.includes('-Lore-'),
                            );

                    if (increases.length) {
                        const oldChoice = character.class.getLoreChoiceBySourceId(increases[0].sourceId);

                        if (oldChoice.available === 1) {
                            this._characterLoreService.removeLore(character, oldChoice);
                        }
                    }
                }

                this._characterLoreService.addLore(character, background.loreChoices[0]);
            }

            if (background.skillChoices[0].increases.length) {
                const existingIncreases =
                    character.skillIncreases(1, 1, background.skillChoices[0].increases[0].name, '');

                if (existingIncreases.length) {
                    const existingIncrease = existingIncreases[0];
                    const existingSkillChoice: SkillChoice = characterClass.getSkillChoiceBySourceId(existingIncrease.sourceId);

                    // If you have already trained this skill from another source:
                    // Check if it is a free training (not locked). If so, remove it and reimburse the skill point,
                    // then replace it with the background's.
                    // If it is locked, we better not replace it. Instead, you get a free Background skill increase.
                    if (existingSkillChoice !== background.skillChoices[0]) {
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

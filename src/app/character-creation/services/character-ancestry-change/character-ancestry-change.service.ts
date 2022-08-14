import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Character } from 'src/app/classes/Character';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { CharacterHeritageChangeService } from '../character-heritage-change/character-heritage-change.service';
import { FeatTakingService } from '../feat-taking/feat-taking.service';
import { FeatProcessingService } from '../feat-processing/feat-processing.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterAncestryChangeService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _featProcessingService: FeatProcessingService,
    ) { }

    public changeAncestry(newAncestry?: Ancestry): void {
        const character = this._characterService.character;

        this._characterHeritageChangeService.changeHeritage();
        this._processRemovingOldAncestry(character);

        if (newAncestry) {
            character.class.ancestry = Object.assign(new Ancestry(), JSON.parse(JSON.stringify(newAncestry))).recast();

            this._processNewAncestry(character);
        } else {
            character.class.ancestry = new Ancestry();
        }

        this._characterService.updateLanguageList();
    }

    private _processRemovingOldAncestry(character: Character): void {
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        if (ancestry?.name) {
            const level = characterClass.levels[1];

            characterClass.languages = characterClass.languages.filter(language => language.source !== ancestry.name);

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Ancestry');

            //Of each granted Item, find the item with the stored id and drop it.
            ancestry.gainItems.forEach(freeItem => {
                this._itemGrantingService.dropGrantedItem(freeItem, character);
            });

            //We must specifically un-take the ancestry's feats to undo their effects.
            ancestry.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(gain => {
                    this._featTakingService.takeFeat(character, undefined, gain.name, false, choice, gain.locked);
                });
            });

            //Remove all Adopted Ancestry feats
            characterClass.levels.forEach(classLevel => {
                classLevel.featChoices.forEach(choice => {
                    choice.feats.filter(gain => gain.name.includes('Adopted Ancestry')).forEach(gain => {
                        this._featProcessingService.processFeat(undefined, false, { creature: character, character, gain, choice, level });
                    });

                    choice.feats = choice.feats.filter(gain => !gain.name.includes('Adopted Ancestry'));
                });
            });
        }
    }

    private _processNewAncestry(character: Character): void {
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        if (characterClass?.ancestry.name) {
            const level = characterClass.levels[1];

            characterClass.languages.push(
                ...ancestry.languages
                    .map(language => Object.assign(new LanguageGain(), { name: language, locked: true, source: ancestry.name })),
            );

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

            level.abilityChoices.push(...ancestry.abilityChoices);

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');

            //Grant all items and save their id in the ItemGain.
            ancestry.gainItems.forEach(freeItem => {
                this._itemGrantingService.grantGrantedItem(freeItem, character);
            });

            //Many feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            ancestry.featChoices.forEach(choice => {
                choice.feats.forEach(gain => {
                    this._featTakingService.takeFeat(character, undefined, gain.name, true, choice, gain.locked);
                });
            });
        }
    }

}

import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { CreatureService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { CharacterHeritageChangeService } from '../character-heritage-change/character-heritage-change.service';
import { FeatTakingService } from '../feat-taking/feat-taking.service';
import { CharacterLanguagesService } from 'src/libs/shared/services/character-languages/character-languages.service';
import { ProcessingServiceProvider } from 'src/app/core/services/processing-service-provider/processing-service-provider.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterAncestryChangeService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _characterLanguagesService: CharacterLanguagesService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public changeAncestry(newAncestry?: Ancestry): void {
        const character = CreatureService.character;

        this._characterHeritageChangeService.changeHeritage();
        this._processRemovingOldAncestry();

        if (newAncestry) {
            character.class.ancestry = newAncestry.clone();

            this._processNewAncestry();
        } else {
            character.class.ancestry = new Ancestry();
        }

        this._characterLanguagesService.updateLanguageList();
    }

    private _processRemovingOldAncestry(): void {
        const character = CreatureService.character;
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

            level.featChoices = level.featChoices.filter(choice => choice.source !== 'Ancestry');

            //Remove all Adopted Ancestry feats
            characterClass.levels.forEach(classLevel => {
                classLevel.featChoices.forEach(choice => {
                    choice.feats.filter(gain => gain.name.includes('Adopted Ancestry')).forEach(gain => {
                        this._psp.featProcessingService?.processFeat(undefined, false, { creature: character, gain, choice, level });
                    });

                    choice.feats = choice.feats.filter(gain => !gain.name.includes('Adopted Ancestry'));
                });
            });
        }
    }

    private _processNewAncestry(): void {
        const character = CreatureService.character;
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
            level.featChoices.push(...ancestry.featChoices);

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');

            //Grant all items and save their id in the ItemGain.
            ancestry.gainItems.forEach(freeItem => {
                this._itemGrantingService.grantGrantedItem(freeItem, character);
            });

            //Process the new feat choices.
            level.featChoices.filter(choice => choice.source === 'Ancestry').forEach(choice => {
                choice.feats.forEach(gain => {
                    this._psp.featProcessingService?.processFeat(undefined, true, { creature: character, gain, choice, level });
                });
            });
        }
    }

}

import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/creatures/character/ancestry';
import { LanguageGain } from 'src/app/classes/creatures/character/language-gain';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { CharacterHeritageChangeService } from '../character-heritage-change/character-heritage-change.service';
import { CharacterLanguagesService } from 'src/libs/shared/services/character-languages/character-languages.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { FeatTakingService } from '../feat-taking/feat-taking.service';

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
    }

    private _processRemovingOldAncestry(): void {
        const character = CreatureService.character;
        const characterClass = character.class;
        const ancestry = characterClass?.ancestry;

        const level = characterClass.levels[1];

        if (ancestry?.name && level) {
            characterClass.languages = characterClass.languages.filter(language => language.source !== ancestry.name);

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Ancestry');

            //Of each granted Item, find the item with the stored id and drop it.
            ancestry.gainItems.forEach(freeItem => {
                this._itemGrantingService.dropGrantedItem(freeItem, character);
            });

            //We must specifically un-take the ancestry's feats to undo their effects.
            level.featChoices.filter(choice => choice.source === 'Ancestry').forEach(choice => {
                choice.feats.forEach(feat => {
                    this._featTakingService.takeFeat(character, undefined, feat.name, false, choice, feat.locked);
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

        const level = characterClass.levels[1];

        if (characterClass?.ancestry.name && level) {
            characterClass.languages.push(
                ...ancestry.languages
                    .map(language => LanguageGain.from({ name: language, locked: true, source: ancestry.name })),
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

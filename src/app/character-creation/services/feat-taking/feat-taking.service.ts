import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { CharacterService } from 'src/app/services/character.service';
import { Feat } from '../../definitions/models/Feat';
import { FeatChoice } from '../../definitions/models/FeatChoice';
import { FeatTaken } from '../../definitions/models/FeatTaken';
import { FeatProcessingService } from '../feat-processing/feat-processing.service';

@Injectable({
    providedIn: 'root',
})
export class FeatTakingService {

    constructor(
        private readonly _featProcessingService: FeatProcessingService,
        private readonly _characterService: CharacterService,
    ) { }

    public takeFeat(
        creature: Character | Familiar,
        feat: Feat,
        featName: string,
        taken: boolean,
        choice: FeatChoice,
        locked: boolean,
        automatic = false,
    ): void {
        const levelNumber = parseInt(choice.id.split('-')[0], 10);
        const level = creature.isCharacter() ? creature.classLevelFromNumber(levelNumber) : null;
        const character = this._characterService.character;

        if (taken) {
            const newLength =
                choice.feats.push(Object.assign(
                    new FeatTaken(),
                    {
                        name: (feat?.name || featName),
                        source: choice.source,
                        locked,
                        automatic,
                        sourceId: choice.id,
                        countAsFeat: (feat?.countAsFeat || feat?.superType || ''),
                    },
                ));
            const gain = choice.feats[newLength - 1];

            this._featProcessingService.processFeat(feat, taken, { creature, character, gain, choice, level });
        } else {
            const choiceFeats = choice.feats;
            const gain = choiceFeats.find(existingFeat =>
                existingFeat.name === featName &&
                existingFeat.locked === locked,
            );

            this._featProcessingService.processFeat(feat, taken, { creature, character, gain, choice, level });
            choiceFeats.splice(choiceFeats.indexOf(gain, 1));
        }
    }

}

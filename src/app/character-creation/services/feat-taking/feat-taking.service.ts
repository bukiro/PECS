import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { Feat } from '../../definitions/models/Feat';
import { FeatChoice } from '../../definitions/models/FeatChoice';
import { FeatTaken } from '../../definitions/models/FeatTaken';

@Injectable({
    providedIn: 'root',
})
export class FeatTakingService {

    constructor(
        private readonly _featsDataService: FeatsDataService,
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

            this._featsDataService.processFeat(creature, feat, gain, choice, level, taken);
        } else {
            const choiceFeats = choice.feats;
            const gain = choiceFeats.find(existingFeat =>
                existingFeat.name === featName &&
                existingFeat.locked === locked,
            );

            this._featsDataService.processFeat(creature, feat, gain, choice, level, taken);
            choiceFeats.splice(choiceFeats.indexOf(gain, 1));
        }
    }

}

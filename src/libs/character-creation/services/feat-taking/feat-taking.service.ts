import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/creatures/character/character';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { FeatTaken } from 'src/libs/shared/definitions/models/FeatTaken';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';

@Injectable({
    providedIn: 'root',
})
export class FeatTakingService {

    constructor(
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public takeFeat(
        creature: Character | Familiar,
        feat: Feat | undefined,
        featName: string,
        taken: boolean,
        choice: FeatChoice,
        locked?: boolean,
        automatic?: boolean,
    ): void {
        const levelNumber = parseInt(choice.id.split('-')[0], 10);
        const level =
            creature.isCharacter()
                ? creature.classLevelFromNumber(levelNumber)
                // If the creature is not the character, the level is never needed.
                // This fallback is just to ensure that the feat processing doesn't complain about the level being undefined.
                : CreatureService.character.classLevelFromNumber(CreatureService.character.level);

        if (taken) {
            const newLength =
                choice.feats.push(
                    FeatTaken.from({
                        name: (feat?.name || featName),
                        source: choice.source,
                        locked,
                        automatic,
                        sourceId: choice.id,
                        countAsFeat: (feat?.countAsFeat || feat?.superType || ''),
                    }),
                );
            const gain = choice.feats[newLength - 1];

            this._psp.featProcessingService?.processFeat(feat, taken, { creature, gain, choice, level });
        } else {
            const choiceFeats = choice.feats;
            const gain = choiceFeats.find(existingFeat =>
                existingFeat.name === featName &&
                (locked !== undefined ? existingFeat.locked === locked : true),
            );

            if (gain) {
                this._psp.featProcessingService?.processFeat(feat, taken, { creature, gain, choice, level });
                choiceFeats.splice(choiceFeats.indexOf(gain, 1));
            }

        }
    }

}

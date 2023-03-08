import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/Deity';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from '../refresh/refresh.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { DeitiesDataService } from '../data/deities-data.service';

interface CharacterDeitySet {
    deity: Deity;
    source: string;
    level: number;
}

@Injectable({
    providedIn: 'root',
})
export class CharacterDeitiesService {

    //The character's deity or deities get loaded into $characterDeities whenever it is queried and empty.
    private readonly _$characterDeities: Array<CharacterDeitySet> = [];

    constructor(
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _refreshService: RefreshService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public changeDeity(deity: Deity): void {
        const character = CreatureService.character;

        character.class.deity = deity.name;
        this.clearCharacterDeities();
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells', 'clear');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
    }

    public currentCharacterDeities(
        source = '',
        levelNumber?: number,
    ): Array<Deity> {
        const character = CreatureService.character;

        const safeLevelNumber = levelNumber || character.level;

        if (!this._$characterDeities.length && character.class.deity) {
            //Recreate the character deities list from the main deity and the Syncretism feat data.
            const mainDeity = this._deitiesDataService.deityFromName(character.class.deity);

            if (mainDeity) {
                this._$characterDeities.push({ deity: mainDeity, source: 'main', level: 1 });

                const hasSyncretismFeat = this._characterFeatsService.characterHasFeat('Syncretism', safeLevelNumber);

                if (hasSyncretismFeat) {
                    const data = character.class.filteredFeatData(0, 0, 'Syncretism')[0];
                    const syncretismDeity = data.valueAsString('deity');

                    if (syncretismDeity) {
                        const syncretismLevelNumber = data.level;
                        const secondDeity = this._deitiesDataService.deityFromName(syncretismDeity);

                        if (secondDeity) {
                            this._$characterDeities.push({ deity: secondDeity, source: 'syncretism', level: syncretismLevelNumber });
                        }
                    }
                }
            }
        }

        return this._$characterDeities
            .filter(deitySet => deitySet.level <= safeLevelNumber && (!source || deitySet.source === source))
            .map(deitySet => deitySet.deity);
    }

    public clearCharacterDeities(): void {
        this._$characterDeities.length = 0;
    }

    public reset(): void {
        this.clearCharacterDeities();
    }

}

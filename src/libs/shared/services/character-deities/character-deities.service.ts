import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/Deity';
import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { RefreshService } from '../refresh/refresh.service';
import { CreatureTypes } from '../../definitions/creatureTypes';

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
    private _$characterDeities: Array<CharacterDeitySet> = [];

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _refreshService: RefreshService,
    ) { }

    public changeDeity(deity: Deity): void {
        const character = this._characterService.character;

        character.class.deity = deity.name;
        this.clearCharacterDeities();
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells', 'clear');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
    }

    public currentCharacterDeities(
        character: Character,
        source = '',
        level: number = character.level,
    ): Array<Deity> {
        if (!this._$characterDeities.length && character.class.deity) {
            //Recreate the character deities list from the main deity and the Syncretism feat data.
            const mainDeity = this._deitiesDataService.deityFromName(character.class.deity);

            if (mainDeity) {
                this._$characterDeities.push({ deity: mainDeity, source: 'main', level: 1 });

                const hasSyncretismFeat = this._characterService.characterHasFeat('Syncretism', level);

                if (hasSyncretismFeat) {
                    const data = character.class.filteredFeatData(0, 0, 'Syncretism')[0];
                    const syncretismDeity = data.valueAsString('deity');

                    if (syncretismDeity) {
                        const levelNumber = data.level;
                        const secondDeity = this._deitiesDataService.deityFromName(syncretismDeity);

                        if (secondDeity) {
                            this._$characterDeities.push({ deity: secondDeity, source: 'syncretism', level: levelNumber });
                        }
                    }
                }
            }
        }

        return this._$characterDeities
            .filter(deitySet => deitySet.level <= level && (!source || deitySet.source === source))
            .map(deitySet => deitySet.deity);
    }

    public clearCharacterDeities(): void {
        this._$characterDeities.length = 0;
    }

    public reset(): void {
        this.clearCharacterDeities();
    }

}

import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/Deity';
import * as json_deities from 'src/assets/json/deities';
import * as json_domains from 'src/assets/json/domains';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { Domain } from 'src/app/classes/Domain';
import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';

interface CharacterDeitySet {
    deity: Deity;
    source: string;
    level: number;
}

@Injectable({
    providedIn: 'root',
})
export class DeitiesService {

    private _deities: Array<Deity> = [];
    private _domains: Array<Domain> = [];
    private _initialized = false;
    //The character's deity or deities get loaded into $characterDeities whenever it is queried and empty.
    private _$characterDeities: Array<CharacterDeitySet> = [];
    private readonly _deitiesMap = new Map<string, Deity>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public deityFromName(name: string): Deity {
        //Returns a named deity from the map.
        return this._deitiesMap.get(name.toLowerCase()) || this._replacementDeity(name);
    }

    public currentCharacterDeities(
        characterService: CharacterService,
        character: Character,
        source = '',
        level: number = character.level,
    ): Array<Deity> {
        if (!this._$characterDeities.length && character.class.deity) {
            //Recreate the character deities list from the main deity and the Syncretism feat data.
            const mainDeity = this.deities(character.class.deity)[0];

            if (mainDeity) {
                this._$characterDeities.push({ deity: mainDeity, source: 'main', level: 1 });

                const syncretismFeat = characterService.characterFeatsTaken(0, level, { featName: 'Syncretism' }).length;

                if (syncretismFeat) {
                    const data = character.class.filteredFeatData(0, 0, 'Syncretism')[0];
                    const syncretismDeity = data.valueAsString('deity');

                    if (syncretismDeity) {
                        const levelNumber = data.level;
                        const secondDeity = this.deities(syncretismDeity)[0];

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

    public deities(name = ''): Array<Deity> {
        if (!this.stillLoading) {
            //If a name is given, try to find a deity by that name in the index map. This should be much quicker.
            if (name) {
                return [this.deityFromName(name)];
            } else {
                return this._deities.filter(deity => !name || deity.name.toLowerCase() === name.toLowerCase());
            }
        } else { return [this._replacementDeity()]; }
    }

    public domains(name = ''): Array<Domain> {
        if (!this.stillLoading) {
            return this._domains.filter(domain => !name || domain.name.toLowerCase() === name.toLowerCase());
        } else { return [new Domain()]; }
    }

    public initialize(): void {
        this._loadDeities();
        this._loadDomains();
        this._deitiesMap.clear();
        this._deities.forEach(deity => {
            this._deitiesMap.set(deity.name.toLowerCase(), deity);
        });
        this._initialized = true;
    }

    public reset(): void {
        this.clearCharacterDeities();
    }

    private _replacementDeity(name?: string): Deity {
        return Object.assign(
            new Deity(),
            { name: 'Deity not found', desc: `${ name ? name : 'The requested deity' } does not exist in the deities list.` },
        );
    }

    private _loadDeities(): void {
        this._deities = [];

        const data = this._extensionsService.extend(json_deities, 'deities');

        Object.keys(data).forEach(key => {
            this._deities.push(...data[key].map((obj: Deity) => Object.assign(new Deity(), obj).recast()));
        });
        this._deities = this._extensionsService.cleanupDuplicates(this._deities, 'name', 'deities') as Array<Deity>;
    }

    private _loadDomains(): void {
        this._domains = [];

        const data = this._extensionsService.extend(json_domains, 'domains');

        Object.keys(data).forEach(key => {
            this._domains.push(...data[key].map((obj: Domain) => Object.assign(new Domain(), obj).recast()));
        });
        this._domains = this._extensionsService.cleanupDuplicates(this._domains, 'name', 'domains') as Array<Domain>;
    }

}

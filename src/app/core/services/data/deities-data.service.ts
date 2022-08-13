import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/Deity';
import * as json_deities from 'src/assets/json/deities';
import * as json_domains from 'src/assets/json/domains';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { Domain } from 'src/app/classes/Domain';
import { CharacterService } from 'src/app/services/character.service';


@Injectable({
    providedIn: 'root',
})
export class DeitiesDataService {

    private _deities: Array<Deity> = [];
    private _domains: Array<Domain> = [];
    private _initialized = false;
    private readonly _deitiesMap = new Map<string, Deity>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _characterService: CharacterService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
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

    public deityFromName(name: string): Deity {
        //Returns a named deity from the map.
        return this._deitiesMap.get(name.toLowerCase()) || this._replacementDeity(name);
    }

    public domains(name = ''): Array<Domain> {
        if (!this.stillLoading) {
            return this._domains.filter(domain => !name || domain.name.toLowerCase() === name.toLowerCase());
        } else { return [new Domain()]; }
    }

    public domainFromName(name: string): Domain {
        return this._domains.find(domain => domain.name.toLowerCase() === name.toLowerCase()) ||
            this._replacementDomain(name);
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

    private _replacementDeity(name?: string): Deity {
        return Object.assign(
            new Deity(),
            { name: 'Deity not found', desc: `${ name ? name : 'The requested deity' } does not exist in the deities list.` },
        );
    }

    private _replacementDomain(name?: string): Domain {
        return Object.assign(
            new Domain(),
            { name: 'Domain not found', desc: `${ name ? name : 'The requested domain' } does not exist in the domains list.` },
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

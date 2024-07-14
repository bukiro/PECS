import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/deities/deity';
import * as json_deities from 'src/assets/json/deities';
import * as json_domains from 'src/assets/json/domains';
import { ImportedJsonFileList } from '../../definitions/types/json-imported-item-file-list';
import { DataLoadingService } from './data-loading.service';
import { Domain } from 'src/app/classes/deities/domain';

@Injectable({
    providedIn: 'root',
})
export class DeitiesDataService {

    private _deities: Array<Deity> = [];
    private _domains: Array<Domain> = [];
    private _initialized = false;
    private readonly _deitiesMap = new Map<string, Deity>();

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
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
        this._deities = this._dataLoadingService.loadSerializable(
            json_deities as ImportedJsonFileList<Deity>,
            'deities',
            'name',
            Deity,
        );

        this._domains = this._dataLoadingService.loadSerializable(
            json_domains,
            'domains',
            'name',
            Domain,
        );

        this._deitiesMap.clear();
        this._deities.forEach(deity => {
            this._deitiesMap.set(deity.name.toLowerCase(), deity);
        });
        this._initialized = true;
    }

    private _replacementDeity(name?: string): Deity {
        return Deity.from({
            name: 'Deity not found', desc: `${ name ? name : 'The requested deity' } does not exist in the deities list.`,
        });
    }

    private _replacementDomain(name?: string): Domain {
        return Domain.from({
            name: 'Domain not found', desc: `${ name ? name : 'The requested domain' } does not exist in the domains list.`,
        });
    }

}

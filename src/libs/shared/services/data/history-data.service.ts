/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import * as json_ancestries from 'src/assets/json/ancestries';
import * as json_backgrounds from 'src/assets/json/backgrounds';
import * as json_heritages from 'src/assets/json/heritages';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/jsonImportedItemFileList';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class HistoryDataService {
    private _ancestries: Array<Ancestry> = [];
    private _heritages: Array<Heritage> = [];
    private _backgrounds: Array<Background> = [];
    private _initialized = false;

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public ancestries(name = ''): Array<Ancestry> {
        if (this._initialized) {
            return this._ancestries.filter(ancestry => !name || ancestry.name.toLowerCase() === name.toLowerCase());
        } else { return [new Ancestry()]; }
    }

    public ancestryFromName(name: string): Ancestry {
        return this.ancestries(name)[0] ||
            this._replacementAncestry(name);
    }

    public heritages(name = '', ancestryName = ''): Array<Heritage> {
        if (this._initialized) {
            return this._heritages.filter(heritage =>
                (!name || heritage.name.toLowerCase() === name.toLowerCase()) &&
                (!ancestryName || this.ancestryFromName(ancestryName).heritages.includes(heritage.name)),
            );
        } else {
            return [new Heritage()];
        }
    }

    public heritagesAndSubtypes(name = ''): Array<Heritage> {
        if (this._initialized) {
            return new Array<Heritage>()
                .concat(
                    ...this._heritages.map(heritage => [heritage, ...heritage.subTypes]),
                )
                .filter(heritage => !name || heritage.name.toLowerCase() === name.toLowerCase());
        } else {
            return [new Heritage()];
        }
    }

    public heritageFromName(name: string): Heritage {
        return this.heritagesAndSubtypes(name)[0] ||
            this._replacementHeritage(name);
    }

    public backgrounds(name = ''): Array<Background> {
        if (this._initialized) {
            return this._backgrounds.filter(background => !name || background.name.toLowerCase() === name.toLowerCase());
        } else { return [new Background()]; }
    }

    public backgroundFromName(name: string): Background {
        return this.backgrounds(name)[0] ||
            this._replacementBackground(name);
    }

    public initialize(): void {
        this._ancestries = this._dataLoadingService.loadRecastable(
            json_ancestries,
            'ancestries',
            'name',
            Ancestry,
        );

        this._backgrounds = this._dataLoadingService.loadRecastable(
            json_backgrounds,
            'backgrounds',
            'name',
            Background,
        );

        this._heritages = this._dataLoadingService.loadRecastable(
            json_heritages as ImportedJsonFileList<Heritage>,
            'heritages',
            'name',
            Heritage,
        );

        this._initialized = true;
    }

    private _replacementAncestry(name?: string): Ancestry {
        return Object.assign(
            new Ancestry(),
            {
                name: 'Ancestry not found',
                desc: `${ name ? name : 'The requested ancestry' } does not exist in the ancestry list.`,
            },
        );
    }

    private _replacementHeritage(name?: string): Heritage {
        return Object.assign(
            new Heritage(),
            {
                name: 'Heritage not found',
                desc: `${ name ? name : 'The requested heritage' } does not exist in the heritage list.`,
            },
        );
    }

    private _replacementBackground(name?: string): Background {
        return Object.assign(
            new Background(),
            {
                name: 'Background not found',
                desc: `${ name ? name : 'The requested background' } does not exist in the background list.`,
            },
        );
    }

}

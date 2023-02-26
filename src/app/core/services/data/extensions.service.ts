/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { switchMap, tap } from 'rxjs';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Types/jsonImportedItemFileList';

type SingleIdentifier = 'id' | 'name';

type MultipleIdentifiers = Array<'parent' | 'key' | 'name' | 'itemFilter' | 'group'>;

type OverrideType<T> = T & {
    overridePriority?: number;
    _extensionFileName?: string;
} & {
    id?: string;
    name?: string;
};

type OverrideTypeMultipleIdentifiers<T> = T & {
    overridePriority?: number;
    _extensionFileName?: string;
} & {
    parent?: string;
    key?: string;
    name?: string;
    itemFilter?: Array<string> | string;
    group?: string;
};

@Injectable({
    providedIn: 'root',
})
export class ExtensionsService {

    public extensions: Record<string, ImportedJsonFileList<unknown>> = {};
    private _remainingToLoad = 0;
    private _finishedLoading = 0;

    constructor(
        private readonly _httpClient: HttpClient,
    ) { }

    public get stillLoading(): boolean {
        return (
            this._finishedLoading === 0 ||
            (this._remainingToLoad - this._finishedLoading > 0)
        );
    }

    public initialize(): void {
        this.extensions = {};
        this._remainingToLoad++;

        this._loadExtensions('assets/json/abilities', 'abilities');
        this._loadExtensions('assets/json/activities', 'activities');
        this._loadExtensions('assets/json/ancestries', 'ancestries');
        this._loadExtensions('assets/json/animalcompanionlevels', 'companionLevels');
        this._loadExtensions('assets/json/animalcompanions', 'companionAncestries');
        this._loadExtensions('assets/json/animalcompanionspecializations', 'companionSpecializations');
        this._loadExtensions('assets/json/armormaterials', 'armorMaterials');
        this._loadExtensions('assets/json/backgrounds', 'backgrounds');
        this._loadExtensions('assets/json/conditions', 'conditions');
        this._loadExtensions('assets/json/deities', 'deities');
        this._loadExtensions('assets/json/domains', 'domains');
        this._loadExtensions('assets/json/effectproperties', 'effectProperties');
        this._loadExtensions('assets/json/familiarabilities', 'familiarAbilities');
        this._loadExtensions('assets/json/feats', 'feats');
        this._loadExtensions('assets/json/features', 'features');
        this._loadExtensions('assets/json/heritages', 'heritages');
        this._loadExtensions('assets/json/itemproperties', 'itemProperties');
        this._loadExtensions('assets/json/items/adventuringgear', 'items_adventuringgear');
        this._loadExtensions('assets/json/items/alchemicalbombs', 'items_alchemicalbombs');
        this._loadExtensions('assets/json/items/alchemicalelixirs', 'items_alchemicalelixirs');
        this._loadExtensions('assets/json/items/alchemicalpoisons', 'items_alchemicalpoisons');
        this._loadExtensions('assets/json/items/alchemicaltools', 'items_alchemicaltools');
        this._loadExtensions('assets/json/items/ammunition', 'items_ammunition');
        this._loadExtensions('assets/json/items/armorrunes', 'items_armorrunes');
        this._loadExtensions('assets/json/items/armors', 'items_armors');
        this._loadExtensions('assets/json/items/helditems', 'items_helditems');
        this._loadExtensions('assets/json/items/materialitems', 'items_materialitems');
        this._loadExtensions('assets/json/items/oils', 'items_oils');
        this._loadExtensions('assets/json/items/otherconsumables', 'items_otherconsumables');
        this._loadExtensions('assets/json/items/otherconsumablesbombs', 'items_otherconsumablesbombs');
        this._loadExtensions('assets/json/items/potions', 'items_potions');
        this._loadExtensions('assets/json/items/scrolls', 'items_scrolls');
        this._loadExtensions('assets/json/items/shields', 'items_shields');
        this._loadExtensions('assets/json/items/snares', 'items_snares');
        this._loadExtensions('assets/json/items/talismans', 'items_talismans');
        this._loadExtensions('assets/json/items/wands', 'items_wands');
        this._loadExtensions('assets/json/items/weaponrunes', 'items_weaponrunes');
        this._loadExtensions('assets/json/items/weapons', 'items_weapons');
        this._loadExtensions('assets/json/items/wornitems', 'items_wornitems');
        this._loadExtensions('assets/json/shieldmaterials', 'shieldMaterials');
        this._loadExtensions('assets/json/skills', 'skills');
        this._loadExtensions('assets/json/specializations', 'specializations');
        this._loadExtensions('assets/json/spells', 'spells');
        this._loadExtensions('assets/json/traits', 'traits');
        this._loadExtensions('assets/json/weaponmaterials', 'weaponMaterials');

        this._finishedLoading++;
    }

    public extend<T>(
        data: ImportedJsonFileList<T>,
        name: string,
    ): ImportedJsonFileList<T> {
        if (this.extensions[name]) {
            Object.keys(this.extensions[name]).forEach(key => {
                data[key] = this.extensions[name][key];
            });
        }

        return data;
    }

    public cleanupDuplicates<T>(data: Array<OverrideType<T>>, identifier: SingleIdentifier, listName: string): Array<T> {
        const oldcount = data.length;
        const duplicates: Array<string> = Array.from(new Set(
            data
                .filter(item =>
                    data.filter(otherItem =>
                        otherItem[identifier] === item[identifier],
                    ).length > 1,
                ).map(item => item[identifier] || ''),
        ));
        const winners: Array<{ object: string; winner: string }> = [];

        duplicates.forEach(duplicate => {
            const highestPriority = Math.max(
                ...data
                    .filter(item => item[identifier] === duplicate)
                    .map(item => item.overridePriority || 0),
            ) || 0;
            const highestItem = data.find(item => item[identifier] === duplicate && (item.overridePriority || 0) === highestPriority);

            if (highestItem) {
                data
                    .filter(item => (item[identifier] === duplicate && item !== highestItem))
                    .forEach(item => { item[identifier] = 'DELETE'; });

                winners.push({ object: duplicate, winner: highestItem._extensionFileName || 'core' });
            }
        });

        const newcount = data.length;

        if (oldcount !== newcount) {
            console.log(`Resolved ${ oldcount - newcount } duplicate${ (oldcount - newcount > 1) ? 's' : '' } in ${ listName }:`);
            console.log(winners);
        }

        return data.filter(item => item[identifier] !== 'DELETE');
    }

    public cleanupDuplicatesWithMultipleIdentifiers<T>(
        data: Array<OverrideTypeMultipleIdentifiers<T>>,
        identifiers: MultipleIdentifiers,
        listName: string,
    ): Array<T> {
        const oldcount = data.length;
        const duplicates: Array<string> = Array.from(new Set(
            data
                .filter(item =>
                    data.filter(otherItem =>
                        //List all items where all identifiers match.
                        !identifiers.map(identifier => otherItem[identifier] === item[identifier]).some(result => result === false),
                    ).length > 1,
                ).map(item => identifiers.map(identifier => item[identifier]))
                .map(item => JSON.stringify(item)),
        ));
        const winners: Array<{ identifiers: string; object: string; winner: string }> = [];

        duplicates.map(duplicate => JSON.parse(duplicate)).forEach(duplicateIdentifiers => {
            const highestPriority = Math.max(
                ...data
                    .filter(item =>
                        !identifiers
                            .map((identifier, index) => item[identifier] === duplicateIdentifiers[index])
                            .some(result => !result),
                    )
                    .map(item => item.overridePriority || 0),
            ) || 0;
            const highestItem = data.find(item =>
                !identifiers
                    .map((identifier, index) => item[identifier] === duplicateIdentifiers[index])
                    .some(result => !result) && (item.overridePriority || 0) === highestPriority,
            );

            data
                .filter(item =>
                    !identifiers
                        .map((identifier, index) => item[identifier] === duplicateIdentifiers[index])
                        .some(result => !result) && item !== highestItem,
                )
                .forEach(item => { item[identifiers[0]] = 'DELETE'; });

            if (highestItem) {
                winners.push(
                    {
                        identifiers: identifiers.join('; '),
                        object: identifiers.map(identifier => highestItem[identifier]).join('; '),
                        winner: highestItem._extensionFileName || 'core',
                    },
                );
            }

        });

        const newcount = data.length;

        if (oldcount !== newcount) {
            console.log(
                `Resolved ${ oldcount - newcount } duplicate${ (oldcount - newcount > 1) ? 's' : '' } `
                + `in ${ listName } (with multiple identifiers):`,
            );
            console.log(winners);
        }

        return data.filter(item => item[identifiers[0]] !== 'DELETE');
    }

    private _loadExtensions(path: string, target: string): void {
        this._remainingToLoad++;

        const headers = new HttpHeaders().set('Cache-Control', 'no-cache')
            .set('Pragma', 'no-cache');

        this._httpClient.request(new HttpRequest('HEAD', `${ path }/extensions.json`, headers))
            .pipe(
                switchMap(() =>
                    this._httpClient.get(`${ path }/extensions.json`, { headers }),
                ),
                tap({
                    next: data => {
                        JSON.parse(JSON.stringify(data)).forEach((extension: { name: string; filename: string }) => {
                            this._loadFile(path, extension.filename, target, extension.name);
                        });
                        this._finishedLoading++;
                        console.clear();
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.NotFound) {
                            console.clear();
                        } else {
                            console.log(`Error loading extension file: ${ error.message }`);
                        }

                        this._finishedLoading++;
                    },
                }),
            )
            .subscribe();
    }

    private _loadFile(path: string, filename: string, target: string, key: string): void {
        this._remainingToLoad++;
        this._httpClient.get<Array<OverrideType<object>>>(`${ path }/${ filename }`)
            .subscribe(data => {
                if (!this.extensions[target]) {
                    this.extensions[target] = {};
                }

                this.extensions[target][key] = data;
                this.extensions[target][key].forEach((obj: OverrideType<object>) => { obj._extensionFileName = filename; });
                this._finishedLoading++;
            });
    }

}

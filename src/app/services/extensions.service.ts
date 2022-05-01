import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ExtensionsService {

    public extensions: unknown;
    private loading = 0;
    private finishedLoading = 0;

    constructor(
        private httpClient: HttpClient
    ) { }

    initialize() {
        this.extensions = new Object;
        this.loading++;

        this.load_Extensions('assets/json/abilities', 'abilities');
        this.load_Extensions('assets/json/activities', 'activities');
        this.load_Extensions('assets/json/ancestries', 'ancestries');
        this.load_Extensions('assets/json/animalcompanionlevels', 'companionLevels');
        this.load_Extensions('assets/json/animalcompanions', 'companionAncestries');
        this.load_Extensions('assets/json/animalcompanionspecializations', 'companionSpecializations');
        this.load_Extensions('assets/json/armormaterials', 'armorMaterials');
        this.load_Extensions('assets/json/backgrounds', 'backgrounds');
        this.load_Extensions('assets/json/conditions', 'conditions');
        this.load_Extensions('assets/json/deities', 'deities');
        this.load_Extensions('assets/json/domains', 'domains');
        this.load_Extensions('assets/json/effectproperties', 'effectProperties');
        this.load_Extensions('assets/json/familiarabilities', 'familiarAbilities');
        this.load_Extensions('assets/json/feats', 'feats');
        this.load_Extensions('assets/json/features', 'features');
        this.load_Extensions('assets/json/heritages', 'heritages');
        this.load_Extensions('assets/json/itemproperties', 'itemProperties');
        this.load_Extensions('assets/json/items/adventuringgear', 'items_adventuringgear');
        this.load_Extensions('assets/json/items/alchemicalbombs', 'items_alchemicalbombs');
        this.load_Extensions('assets/json/items/alchemicalelixirs', 'items_alchemicalelixirs');
        this.load_Extensions('assets/json/items/alchemicalpoisons', 'items_alchemicalpoisons');
        this.load_Extensions('assets/json/items/alchemicaltools', 'items_alchemicaltools');
        this.load_Extensions('assets/json/items/ammunition', 'items_ammunition');
        this.load_Extensions('assets/json/items/armorrunes', 'items_armorrunes');
        this.load_Extensions('assets/json/items/armors', 'items_armors');
        this.load_Extensions('assets/json/items/helditems', 'items_helditems');
        this.load_Extensions('assets/json/items/materialitems', 'items_materialitems');
        this.load_Extensions('assets/json/items/oils', 'items_oils');
        this.load_Extensions('assets/json/items/otherconsumables', 'items_otherconsumables');
        this.load_Extensions('assets/json/items/otherconsumablesbombs', 'items_otherconsumablesbombs');
        this.load_Extensions('assets/json/items/potions', 'items_potions');
        this.load_Extensions('assets/json/items/scrolls', 'items_scrolls');
        this.load_Extensions('assets/json/items/shields', 'items_shields');
        this.load_Extensions('assets/json/items/snares', 'items_snares');
        this.load_Extensions('assets/json/items/talismans', 'items_talismans');
        this.load_Extensions('assets/json/items/wands', 'items_wands');
        this.load_Extensions('assets/json/items/weaponrunes', 'items_weaponrunes');
        this.load_Extensions('assets/json/items/weapons', 'items_weapons');
        this.load_Extensions('assets/json/items/wornitems', 'items_wornitems');
        this.load_Extensions('assets/json/shieldmaterials', 'shieldMaterials');
        this.load_Extensions('assets/json/skills', 'skills');
        this.load_Extensions('assets/json/specializations', 'specializations');
        this.load_Extensions('assets/json/spells', 'spells');
        this.load_Extensions('assets/json/traits', 'traits');
        this.load_Extensions('assets/json/weaponmaterials', 'weaponMaterials');

        this.finishedLoading++;
    }

    still_loading() {
        return (this.finishedLoading == 0 || (this.loading - this.finishedLoading != 0));
    }

    load_Extensions(path: string, target: string) {
        this.loading++;

        const headers = new HttpHeaders().set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

        this.httpClient.request(new HttpRequest('HEAD', `${ path }/extensions.json`, headers))
            .subscribe({
                next: (response: HttpResponse<unknown>) => {
                    if (response.status == 200) {
                        this.httpClient.get(`${ path }/extensions.json`, { headers })
                            .subscribe({
                                next: data => {
                                    JSON.parse(JSON.stringify(data)).forEach((extension: { name: string, filename: string }) => {
                                        this.load_File(path, extension.filename, target, extension.name);
                                    });
                                },
                                error: error => {
                                    console.log(`Error loading extension file: ${ error.message }`);
                                },
                                complete: () => {
                                    this.finishedLoading++;
                                }
                            });
                    }
                },
                error: error => {
                    if (error.status == 404) {
                        console.clear();
                    } else {
                        console.log(`Error loading extension file: ${ error.message }`);
                    }
                    this.finishedLoading++;
                }
            });

    }

    extend(data: unknown, name: string) {
        if (this.extensions[name]) {
            Object.keys(this.extensions[name]).forEach(key => {
                data[key] = this.extensions[name][key];
            });
        }
        return data;
    }

    cleanup_Duplicates(data: unknown[], identifier: string, listName: string) {
        const oldcount = data.length;
        const duplicates: string[] = Array.from(new Set(
            data
                .filter(item =>
                    data.filter(otherItem =>
                        otherItem[identifier] == item[identifier]
                    ).length > 1
                ).map(item => item[identifier])
        ));
        const winners: { object: string, winner: string }[] = [];
        duplicates.forEach(duplicate => {
            const highestPriority = Math.max(
                ...data
                    .filter(item => item[identifier] == duplicate)
                    .map(item => item['overridePriority'] || 0)
            ) || 0;
            const highestItem = data.find(item => item[identifier] == duplicate && (item['overridePriority'] || 0) == highestPriority);
            data = data.filter(item => !(item[identifier] == duplicate && item !== highestItem));
            winners.push({ object: duplicate, winner: highestItem['_extensionFileName'] || 'core' });
        });
        const newcount = data.length;
        if (oldcount != newcount) {
            console.log(`Resolved ${ oldcount - newcount } duplicate${ (oldcount - newcount > 1) ? 's' : '' } in ${ listName }:`);
            console.log(winners);
        }
        return data;
    }

    cleanup_DuplicatesWithMultipleIdentifiers(data: unknown[], identifiers: string[], listName: string) {
        const oldcount = data.length;
        const duplicates: string[] = Array.from(new Set(
            data
                .filter(item =>
                    data.filter(otherItem =>
                        //List all items where all identifiers match.
                        !identifiers.map(identifier => otherItem[identifier] == item[identifier]).some(result => result == false)
                    ).length > 1
                ).map(item => identifiers.map(identifier => item[identifier])).map(item => JSON.stringify(item))
        ));
        const winners: { identifiers: string, object: string, winner: string }[] = [];
        duplicates.map(duplicate => JSON.parse(duplicate)).forEach(duplicateIdentifiers => {
            const highestPriority = Math.max(
                ...data
                    .filter(item => !identifiers.map((identifier, index) => item[identifier] == duplicateIdentifiers[index]).some(result => !result))
                    .map(item => item['overridePriority'] || 0)
            ) || 0;
            const highestItem = data.find(item => !identifiers.map((identifier, index) => item[identifier] == duplicateIdentifiers[index]).some(result => !result) && (item['overridePriority'] || 0) == highestPriority);
            data = data.filter(item => !(!identifiers.map((identifier, index) => item[identifier] == duplicateIdentifiers[index]).some(result => !result) && item !== highestItem));
            winners.push({ identifiers: identifiers.join('; '), object: identifiers.map(identifier => highestItem[identifier]).join('; '), winner: highestItem['_extensionFileName'] || 'core' });
        });
        const newcount = data.length;
        if (oldcount != newcount) {
            console.log(`Resolved ${ oldcount - newcount } duplicate${ (oldcount - newcount > 1) ? 's' : '' } in ${ listName } (with multiple identifiers):`);
            console.log(winners);
        }
        return data;
    }

    load_File(path: string, filename: string, target: string, key: string) {
        this.loading++;
        this.httpClient.get(`${ path }/${ filename }`)
            .toPromise()
            .then(data => {
                if (!this.extensions[target]) {
                    this.extensions[target] = new Object;
                }
                this.extensions[target][key] = data;
                this.extensions[target][key].forEach((obj: object) => { obj['_extensionFileName'] = filename; });
                this.finishedLoading++;
            });
    }

}

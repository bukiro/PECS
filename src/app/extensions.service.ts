import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ExtensionsService {

    public extensions: any;
    private loading: number = 0;
    private finishedLoading: number = 0;

    constructor(
        private httpClient: HttpClient
    ) { }

    initialize() {
        //Initialize only once.
        if (!this.extensions && !this.finishedLoading) {
            this.extensions = new Object;
            this.loading++;

            this.load_Extensions("assets/json/abilities", "abilities");
            this.load_Extensions("assets/json/activities", "activities");
            this.load_Extensions("assets/json/ancestries", "ancestries");
            this.load_Extensions("assets/json/animalcompanionlevels", "companionLevels");
            this.load_Extensions("assets/json/animalcompanions", "companionAncestries");
            this.load_Extensions("assets/json/animalcompanionspecializations", "companionSpecializations");
            this.load_Extensions("assets/json/armormaterials", "armorMaterials");
            this.load_Extensions("assets/json/backgrounds", "backgrounds");
            this.load_Extensions("assets/json/conditions", "conditions");
            this.load_Extensions("assets/json/deities", "deities");
            this.load_Extensions("assets/json/domains", "domains");
            this.load_Extensions("assets/json/effectproperties", "effectProperties");
            this.load_Extensions("assets/json/familiarabilities", "familiarAbilities");
            this.load_Extensions("assets/json/feats", "feats");
            this.load_Extensions("assets/json/features", "features");
            this.load_Extensions("assets/json/heritages", "heritages");
            this.load_Extensions("assets/json/itemproperties", "itemProperties");
            this.load_Extensions("assets/json/items/adventuringgear", "items_adventuringgear");
            this.load_Extensions("assets/json/items/alchemicalbombs", "items_alchemicalbombs");
            this.load_Extensions("assets/json/items/alchemicalelixirs", "items_alchemicalelixirs");
            this.load_Extensions("assets/json/items/alchemicalpoisons", "items_alchemicalpoisons");
            this.load_Extensions("assets/json/items/alchemicaltools", "items_alchemicaltools");
            this.load_Extensions("assets/json/items/ammunition", "items_ammunition");
            this.load_Extensions("assets/json/items/armorrunes", "items_armorrunes");
            this.load_Extensions("assets/json/items/armors", "items_armors");
            this.load_Extensions("assets/json/items/helditems", "items_helditems");
            this.load_Extensions("assets/json/items/oils", "items_oils");
            this.load_Extensions("assets/json/items/otherconsumables", "items_otherconsumables");
            this.load_Extensions("assets/json/items/otherconsumablesbombs", "items_otherconsumablesbombs");
            this.load_Extensions("assets/json/items/potions", "items_potions");
            this.load_Extensions("assets/json/items/scrolls", "items_scrolls");
            this.load_Extensions("assets/json/items/shields", "items_shields");
            this.load_Extensions("assets/json/items/snares", "items_snares");
            this.load_Extensions("assets/json/items/talismans", "items_talismans");
            this.load_Extensions("assets/json/items/wands", "items_wands");
            this.load_Extensions("assets/json/items/weaponrunes", "items_weaponrunes");
            this.load_Extensions("assets/json/items/weapons", "items_weapons");
            this.load_Extensions("assets/json/items/wornitems", "items_wornitems");
            this.load_Extensions("assets/json/shieldmaterials", "shieldMaterials");
            this.load_Extensions("assets/json/skills", "skills");
            this.load_Extensions("assets/json/specializations", "specializations");
            this.load_Extensions("assets/json/spells", "spells");
            this.load_Extensions("assets/json/traits", "traits");
            this.load_Extensions("assets/json/weaponmaterials", "weaponMaterials");

            this.finishedLoading++;
        }
    }

    still_loading() {
        return (this.finishedLoading == 0 || (this.loading - this.finishedLoading != 0));
    }

    load_Extensions(path: string, target: string) {
        this.loading++;

        let headers = new HttpHeaders().set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

        this.httpClient.request(new HttpRequest("HEAD", path + "/extensions.json", headers))
            .toPromise()
            .then((response: HttpResponse<unknown>) => {
                if (response.status == 200) {
                    this.httpClient.get(path + "/extensions.json", { headers })
                        .toPromise()
                        .then(data => {
                            JSON.parse(JSON.stringify(data)).forEach((extension: { name: string, filename: string }) => {
                                this.load_File(path, extension.filename, target, extension.name);
                            })
                        }).catch(error => {
                            console.log("Error loading extension file: " + error.message);
                        }).finally(() => {
                            this.finishedLoading++;
                        })
                }
            }).catch(error => {
                if (error.status == 404) {
                    console.clear();
                } else {
                    console.log("Error loading extension file: " + error.message);
                }
                this.finishedLoading++;
            })

    }

    extend(data: any, name: string) {
        if (this.extensions[name]) {
            Object.keys(this.extensions[name]).forEach(key => {
                data[key] = this.extensions[name][key];
            })
        }
        return data;
    }

    cleanup_Duplicates(data: any[], identifier: string, listName: string) {
        let oldcount = data.length;
        let duplicates: string[] = Array.from(new Set(
            data
                .filter(item =>
                    data.filter(otherItem =>
                        otherItem[identifier] == item[identifier]
                    ).length > 1
                ).map(item => item[identifier])
        ));
        duplicates.forEach(duplicateIdentifier => {
            let highestPriority = Math.max(
                ...data
                    .filter(item => item[identifier] == duplicateIdentifier)
                    .map(item => item.overridePriority || 0)
            ) || 0;
            let highestItem = data.find(item => item[identifier] == duplicateIdentifier && (item.overridePriority || 0) == highestPriority);
            data = data.filter(item => !(item[identifier] == duplicateIdentifier && item !== highestItem));
        })
        let newcount = data.length;
        if (oldcount != newcount) {
            console.log("Removed " + (oldcount - newcount) + " duplicates from " + listName + ":");
            console.log(duplicates);
        }
        return data;
    }

    cleanup_DuplicatesWithMultipleIdentifiers(data: any[], identifiers: string[], listName: string) {
        let oldcount = data.length;
        let duplicates: string[][] = Array.from(new Set(
            data
                .filter(item =>
                    data.filter(otherItem =>
                        //List all items where all identifiers match.
                        !identifiers.map(identifier => otherItem[identifier] == item[identifier]).some(result => result == false)
                    ).length > 1
                ).map(item => identifiers.map(identifier => item[identifier]))
        ));
        duplicates.forEach(duplicateIdentifiers => {
            let highestPriority = Math.max(
                ...data
                    .filter(item => !identifiers.map((identifier, index) => item[identifier] == duplicateIdentifiers[index]).some(result => !result))
                    .map(item => item.overridePriority || 0)
            ) || 0;
            let highestItem = data.find(item => !identifiers.map((identifier, index) => item[identifier] == duplicateIdentifiers[index]).some(result => !result) && (item.overridePriority || 0) == highestPriority);
            data = data.filter(item => !(!identifiers.map((identifier, index) => item[identifier] == duplicateIdentifiers[index]).some(result => !result) && item !== highestItem));
        })
        let newcount = data.length;
        if (oldcount != newcount) {
            console.log("Removed " + (oldcount - newcount) + " duplicates (multiple identifier)")
        }
        return data;
    }

    load_File(path: string, filename: string, target: string, key: string) {
        this.loading++;
        this.httpClient.get(path + "/" + filename)
            .toPromise()
            .then(data => {
                if (!this.extensions[target]) {
                    this.extensions[target] = new Object;
                }
                this.extensions[target][key] = data;
                this.finishedLoading++;
            })
    }

}

//TO-DO: Clean up all these different lookup functions; I'm sure we don't need them all?
import { Injectable } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import * as json_feats from 'src/assets/json/feats';
import * as json_features from 'src/assets/json/features';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { Weapon } from '../../../classes/Weapon';
import { HistoryDataService } from './history-data.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { ItemsDataService } from './items-data.service';

@Injectable({
    providedIn: 'root',
})
export class FeatsDataService {
    private _feats: Array<Feat> = [];
    private _features: Array<Feat> = [];
    private _initialized = false;
    private readonly _featsMap = new Map<string, Feat>();
    private readonly _featuresMap = new Map<string, Feat>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _historyDataService: HistoryDataService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public feats(customFeats: Array<Feat>, name = '', type = ''): Array<Feat> {
        if (!this.stillLoading) {
            //If only a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (name && !type) {
                return [this._featFromName(customFeats, name)];
            }

            return this._feats.concat(customFeats).filter(feat =>
                (
                    !name ||
                    feat.name.toLowerCase() === name.toLowerCase()
                ) &&
                (
                    !type ||
                    feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
                ),
            );
        }

        return [this._replacementFeat()];
    }

    public features(name = ''): Array<Feat> {
        if (!this.stillLoading) {
            //If a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (name) {
                return [this._featureFromName(name)];
            }

            return this._features;
        } else { return [this._replacementFeat()]; }
    }

    public createWeaponFeats(weapons: Array<Weapon> = this._itemsDataService.cleanItemsOfType('weapons')): Array<Feat> {
        const weaponFeats = this._feats.filter(feat => feat.weaponfeatbase);
        const resultingFeats: Array<Feat> = [];

        weaponFeats.forEach(feat => {
            let featweapons = weapons;

            //These filters are hardcoded according to the needs of the weaponfeatbase feats.
            // Certain codewords are replaced with matching names, such as in
            // "Advanced Weapon", "Uncommon Ancestry Weapon" or "Uncommon Ancestry Advanced Weapon"
            if (feat.subType.includes('Uncommon')) {
                featweapons = featweapons.filter(weapon => weapon.traits.includes('Uncommon'));
            }

            if (feat.subType.includes('Simple')) {
                featweapons = featweapons.filter(weapon => weapon.prof === WeaponProficiencies.Simple);
            } else if (feat.subType.includes('Martial')) {
                featweapons = featweapons.filter(weapon => weapon.prof === WeaponProficiencies.Martial);
            } else if (feat.subType.includes('Advanced')) {
                featweapons = featweapons.filter(weapon => weapon.prof === WeaponProficiencies.Advanced);
            }

            if (feat.subType.includes('Ancestry')) {
                const ancestries: Array<string> = this._historyDataService.ancestries().map(ancestry => ancestry.name);

                featweapons = featweapons.filter(weapon => weapon.traits.some(trait => ancestries.includes(trait)));
            }

            featweapons.forEach(weapon => {
                const regex = new RegExp(feat.subType, 'g');
                let featString = JSON.stringify(feat);

                featString = featString.replace(regex, weapon.name);

                const newFeat = Object.assign<Feat, Feat>(new Feat(), JSON.parse(featString)).recast();

                newFeat.hide = false;
                newFeat.weaponfeatbase = false;
                newFeat.generatedWeaponFeat = true;
                resultingFeats.push(newFeat);
            });
        });

        return resultingFeats;
    }

    public featsAndFeatures(customFeats: Array<Feat>, name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        // ATTENTION: Use this function sparingly!
        // There are thousands of feats.
        // Particularly if you need to find out if you have a feat with an attribute, use get_CharacterFeats instead:
        // DON'T: iterate through all taken feats, do get_All([], name)[0] and check the attribute
        // DO: get_CharacterFeats(), check the attribute and THEN check if you have the feat on the correct level.
        // That way, if you have 20 feats, and there are 4 feats with that attribute,
        // you only do 20 + 4 * 20 comparisons instead of 20 * 1000.
        if (!this.stillLoading) {
            //If a name is the only given parameter, we can get the feat or feature from the customFeats or the map more quickly.
            if (name && !type && !includeSubTypes && !includeCountAs) {
                return name.toLowerCase().split(' or ')
                    .map(alternative => this.featOrFeatureFromName(customFeats, alternative))
                    .filter(feat => feat);
            }

            return this.filterFeats(this._feats.concat(customFeats).concat(this._features), name, type, includeSubTypes, includeCountAs);
        }

        return [this._replacementFeat()];
    }

    public featOrFeatureFromName(customFeats: Array<Feat>, name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feature from the map, or a named feat from the map.
        return customFeats.find(feat => feat.name.toLowerCase() === name.toLowerCase()) ||
            this._featuresMap.get(name.toLowerCase()) ||
            this._featsMap.get(name.toLowerCase()) ||
            this._replacementFeat(name);
    }

    public filterFeats(feats: Array<Feat>, name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        return feats.filter(feat =>
            !name ||
            //For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
            name.toLowerCase().split(' or ')
                .some(alternative =>
                    !alternative ||
                    feat.name.toLowerCase() === alternative ||
                    (
                        includeSubTypes &&
                        feat.superType.toLowerCase() === alternative
                    ) ||
                    (
                        includeCountAs &&
                        feat.countAsFeat.toLowerCase() === alternative
                    ),
                ) &&
            (
                !type ||
                feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase())
            ),
        );
    }

    public initialize(): void {
        const waitForItemsDataService = setInterval(() => {
            if (!this._itemsDataService.stillLoading) {
                clearInterval(waitForItemsDataService);

                this._feats = this._load(json_feats, 'feats');

                // Create feats that are based on weapons in the store.
                const customFeats = this.createWeaponFeats();

                this._feats = this._feats.concat(customFeats);
                // Add all feats to the feats map, including custom feats.
                this._featsMap.clear();
                this._feats.forEach(feat => {
                    this._featsMap.set(feat.name.toLowerCase(), feat);
                });

                this._features = this._load(json_features, 'features');
                this._featuresMap.clear();
                // Add all features to the features map, including custom feats.
                this._features.forEach(feature => {
                    this._featuresMap.set(feature.name.toLowerCase(), feature);
                });

                this._initialized = true;
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._feats.forEach(feat => {
            feat.hints.forEach(hint => hint.deactivateAll());
        });
        //Disable any active hint effects when loading a character.
        this._features.forEach(feat => {
            feat.hints.forEach(hint => hint.deactivateAll());
        });
    }

    private _replacementFeat(name?: string): Feat {
        return Object.assign(
            new Feat(),
            {
                name: 'Feat not found',
                desc: `${ name ? name : 'The requested feat or feature' } does not exist in the feat and features lists.`,
            },
        );
    }

    private _featFromName(customFeats: Array<Feat>, name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feat from the map.
        return customFeats.find(feat => feat.name.toLowerCase() === name.toLowerCase()) ||
            this._featsMap.get(name.toLowerCase()) ||
            this._replacementFeat(name);
    }

    private _featureFromName(name: string): Feat {
        //Returns a named feat from the features map;
        return this._featuresMap.get(name.toLowerCase()) || this._replacementFeat(name);
    }

    private _load(
        data: { [fileContent: string]: Array<unknown> },
        target: 'features' | 'feats',
    ): Array<Feat> {
        let resultingData: Array<Feat> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(Object.create(Feat), entry).recast(),
            ));
        });

        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'name', target);

        return resultingData;
    }

}

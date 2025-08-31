import * as json_feats from 'src/assets/json/feats';
import * as json_features from 'src/assets/json/features';
import * as json_abilities from 'src/assets/json/familiarabilities';
import { computed, inject, Injectable, Signal } from '@angular/core';
import { WeaponProficiencies } from 'src/libs/shared/attacks/util/models/weapon-proficiencies';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { Weapon } from 'src/libs/shared/items/util/models/weapon';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { Feat } from '../../util/models/feat';
import { ItemsDataService } from 'src/libs/shared/items/domain/services/items-data.service';
import { HistoryDataService } from 'src/libs/shared/character/domain/services/history-data.service';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { FeatGain } from '../../util/models/feat-gain';
import { matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';


@Injectable({
    providedIn: 'root',
})
export class FeatsDataService {
    private _feats: Array<Feat> = [];
    private _features: Array<Feat> = [];
    private _familiarAbilities: Array<Feat> = [];
    private _initialized = false;
    private readonly _featsMap = new Map<string, Feat>();
    private readonly _featuresMap = new Map<string, Feat>();
    private readonly _familiarAbilitiesMap = new Map<string, Feat>();

    private readonly _dataLoadingService = inject(DataLoadingService);
    private readonly _itemsDataService = inject(ItemsDataService);
    private readonly _historyDataService = inject(HistoryDataService);
    private readonly _recastService = inject(RecastService);

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public feats(customFeats: Array<Feat>, filter: { type?: string; subTypeOf?: string }): Array<Feat> {
        if (this.stillLoading) {
            return [];
        }

        return this._feats.concat(customFeats).filter(feat =>
            matchStringFilter({ value: feat.traits, match: filter.type })
            && matchStringFilter({ value: feat.superType, match: filter.subTypeOf }),
        );
    }

    public features(): Array<Feat> {
        if (this.stillLoading) {
            return [];
        }

        return this._features;
    }

    public familiarAbilities(name?: string): Array<Feat> {
        if (this.stillLoading) {
            return [];
        }

        if (name) {
            return [this.familiarAbilityFromName(name)];
        }

        return this._familiarAbilities;
    }

    public createWeaponFeats(weapons: Array<Weapon>): Array<Feat> {
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

                const newFeat = Feat.from(JSON.parse(featString), RecastService.recastFns);

                newFeat.hide = false;
                newFeat.weaponfeatbase = false;
                newFeat.generatedWeaponFeat = true;
                resultingFeats.push(newFeat);
            });
        });

        return resultingFeats;
    }

    public allFeatsAndFeatures(
        customFeats: Array<Feat>,
    ): Array<Feat> {
        if (this.stillLoading) {
            return [];
        }

        return this._feats.concat(customFeats).concat(this._features);
    }

    public featOrFeatureFromName(customFeatsMap: Map<string, Feat>, name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feature from the map, or a named feat from the map.
        const normalizedName = name.toLowerCase();

        return customFeatsMap.get(normalizedName) ||
            this._featuresMap.get(normalizedName) ||
            this._featsMap.get(normalizedName) ||
            this._replacementFeat(name);
    }

    public featFromName(customFeatsMap: Map<string, Feat>, name: string): Feat {
        //Returns either a feat from the given custom feats, or a named feat from the map.
        const normalizedName = name.toLowerCase();

        return customFeatsMap.get(normalizedName) ||
            this._featsMap.get(normalizedName) ||
            this._replacementFeat(name);
    }

    public featureFromName(name: string): Feat {
        //Returns a named feat from the features map;
        return this._featuresMap.get(name.toLowerCase()) || this._replacementFeat(name);
    }

    public familiarAbilityFromName(name: string): Feat {
        return this._familiarAbilitiesMap.get(name.toLowerCase()) || this._replacementFeat(name);
    }

    public initialize(): void {
        const waitForItemsDataService = setInterval(() => {
            if (!this._itemsDataService.stillLoading) {
                clearInterval(waitForItemsDataService);

                this._feats = this._dataLoadingService.loadSerializable(
                    json_feats as ImportedJsonFileList<Feat>,
                    'feats',
                    'name',
                    Feat,
                );

                // Create feats that are based on weapons in the store.
                const customFeats = this.createWeaponFeats(this._itemsDataService.cleanItems().weapons());

                this._feats = this._feats.concat(customFeats);
                // Add all feats to the feats map, including custom feats.
                this._featsMap.clear();
                this._feats.forEach(feat => {
                    this._featsMap.set(feat.name.toLowerCase(), feat);
                });

                this._features = this._dataLoadingService.loadSerializable(
                    json_features as ImportedJsonFileList<Feat>,
                    'features',
                    'name',
                    Feat,
                );

                this._featuresMap.clear();
                // Add all features to the features map.
                this._features.forEach(feature => {
                    this._featuresMap.set(feature.name.toLowerCase(), feature);
                });

                this._familiarAbilities = this._dataLoadingService.loadSerializable(
                    json_abilities as ImportedJsonFileList<Feat>,
                    'familiarAbilities',
                    'name',
                    Feat,
                );

                this._familiarAbilitiesMap.clear();

                this._familiarAbilities.forEach(ability => {
                    this._familiarAbilitiesMap.set(ability.name.toLowerCase(), ability);
                });

                this._registerRecastFns();

                this._initialized = true;
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._feats.forEach(feat => {
            feat.hints.forEach(hint => hint.deactivateAll());
        });
        this._features.forEach(feat => {
            feat.hints.forEach(hint => hint.deactivateAll());
        });
        this._familiarAbilities.forEach(ability => {
            ability.hints.forEach(hint => hint.deactivateAll());
        });
    }

    private _replacementFeat(name?: string): Feat {
        return Feat.from(
            {
                name: 'Feat or Ability not found',
                desc: `${ name ? name : 'The requested feat, feature or familiar ability' } does not exist in the library.`,
            },
            RecastService.recastFns,
        );
    }

    private _registerRecastFns(): void {
        const featLookupFn =
            (gain: FeatGain): Signal<Feat> => computed(() => {
                const normalizedName = gain.name$$().toLowerCase() ?? '';

                if (!normalizedName) {
                    return this._replacementFeat();
                }

                const customFeatsMap = CreatureService.character$$().featsAdapter.customFeatsMap$$();

                return customFeatsMap.get(normalizedName)
                    || this._featsMap.get(normalizedName)
                    || this._featuresMap.get(normalizedName)
                    || this._familiarAbilitiesMap.get(normalizedName)
                    || this._replacementFeat(normalizedName);
            });

        this._recastService.registerFeatLookupFns(featLookupFn);
    }
}

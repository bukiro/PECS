import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import * as json_traits from 'src/assets/json/traits';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { Trait } from '../../util/models/trait';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

@Injectable({
    providedIn: 'root',
})
export class TraitsDataService {

    private _traits: Array<Trait> = [];
    private readonly _initialized$$ = signal(false);
    private readonly _traitsMap = new Map<string, Trait>();

    private readonly _cache = {
        traitsShowingHintsOnThis: new WeakMap<Creature, Map<string, Signal<Array<{ trait: Trait; itemNames: Array<string> }>>>>(),
    };

    private readonly _dataLoadingService = inject(DataLoadingService);
    private readonly _recastService = inject(RecastService);

    public get stillLoading(): boolean {
        return !this._initialized$$();
    }

    public traitFromName(name: string): Trait {
        //Returns a named trait from the map.

        // Because traits can be dynamic, any trait with a space in the name has to be tried in all combinations,
        // e.g. "Two-Hand d12" is tried as "Two-Hand d12" and as "Two-Hand".
        if (name.includes(' ')) {
            const split = name.split(' ');

            for (let length = split.length; length > 0; length--) {
                const combination = split.slice(0, length).join(' ');
                const trait = this._traitsMap.get(combination.toLowerCase());

                if (trait) {
                    return trait;
                }
            }
        }

        return this._traitsMap.get(name.toLowerCase()) || this._replacementTrait(name);
    }

    public traits(traitName = ''): Array<Trait> {
        if (!this.stillLoading) {
            //If only a name is given, try to find a feat by that name in the index map. This should be much quicker.
            //If no trait is found with that exact name, continue the search, considering composite trait names.
            if (traitName) {
                const trait = this.traitFromName(traitName);

                if (trait?.name === traitName) {
                    return [trait];
                }
            }

            // Some trait instances have information after the trait name,
            // so we allow traits that are included in the name as long as they have the dynamic attribute.
            const traits = this._traits
                .filter(trait =>
                    !traitName ||
                    trait.name === traitName ||
                    (
                        trait.dynamic &&
                        traitName.includes(`${ trait.name } `)
                    ),
                );

            if (traits.length) {
                return traits;
            }
        }

        return [this._replacementTrait()];
    }

    public traitsShowingHintsOnThis$$(creature: Creature, name: string): Signal<Array<{ trait: Trait; itemNames: Array<string> }>> {
        return weaklyCachedSignalWithKey(
            () => computed(() => {
                if (!this._initialized$$()) {
                    return [];
                }

                const isLoreName = stringEqualsCaseInsensitive(name, 'lore', { allowPartialString: true });

                // Find all traits that are set to 'showon' this named object.
                const nameMatchingTraits = this.traits().filter(trait =>
                    trait.hints.some(hint =>
                        hint.showon
                            .split(',')
                            .map(showon => showon.trim())
                            .some(showon =>
                                stringEqualsCaseInsensitive(showon, name)
                                || stringEqualsCaseInsensitive(showon, `${ creature.type }:${ name }`)
                                || (
                                    isLoreName && stringEqualsCaseInsensitive(showon, 'lore')
                                ),
                            ),
                    ),
                );

                const inventories = creature.inventories();

                // Return all those traits that are on any equipped equipment in your inventory
                // Uses the itemsWithTrait$$() method of ItemCollection that returns any equipment that has this trait.
                return nameMatchingTraits.map(trait => ({
                    trait,
                    itemNames: inventories.map(inv => inv.itemsWithTrait$$(trait)()).flat()
                        .map(item => item.effectiveName$$()),
                }));
            }),
            { store: this._cache.traitsShowingHintsOnThis, objKey: creature, key: name },
        );
    }

    public initialize(): void {
        this._traits = this._dataLoadingService.loadSerializable(
            json_traits as ImportedJsonFileList<Trait>,
            'traits',
            'name',
            Trait,
        );

        this._traits.forEach(trait => {
            this._traitsMap.set(trait.name.toLowerCase(), trait);
        });

        this._registerRecastFns();

        this._initialized$$.set(true);
    }

    public reset(): void {
        this._traits.forEach(trait => {
            trait.hints?.forEach(hint => hint.deactivateAll());
        });
    }

    private _replacementTrait(name?: string): Trait {
        return Trait.from(
            { name: 'Trait not found', desc: `${ name ? name : 'The requested trait' } does not exist in the traits list.` },
            RecastService.recastFns,
        );
    }

    private _registerRecastFns(): void {
        const traitLookupFn =
            (name: string): Trait =>
                this.traitFromName(name);

        this._recastService.registerTraitLookupFns(traitLookupFn);
    }

}

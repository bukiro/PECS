import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, of, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Trait } from 'src/app/classes/hints/trait';
import * as json_traits from 'src/assets/json/traits';
import { ImportedJsonFileList } from '../../definitions/types/json-imported-item-file-list';
import { RecastService } from '../recast/recast.service';
import { DataLoadingService } from './data-loading.service';
import { emptySafeCombineLatest } from '../../util/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class TraitsDataService {

    private _traits: Array<Trait> = [];
    private readonly _initialized$ = new BehaviorSubject(false);
    private readonly _traitsMap = new Map<string, Trait>();

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized$.value;
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

    public traitsShowingHintsOnThis$(creature: Creature, name: string): Observable<Array<{ trait: Trait; itemNames: Array<string> }>> {
        return this._initialized$
            .pipe(
                switchMap(stillLoading => {
                    if (stillLoading) {
                        return of([]);
                    } else {
                        // Find all traits that are set to 'showon' this named object.
                        const nameMatchingTraits = this.traits().filter(trait =>
                            trait.hints.some(hint =>
                                hint.showon.split(',').some(showon =>
                                    showon.trim().toLowerCase() === name.toLowerCase() ||
                                    showon.trim().toLowerCase() === (`${ creature.type }:${ name }`).toLowerCase() ||
                                    (
                                        name.toLowerCase().includes('lore') &&
                                        showon.trim().toLowerCase() === 'lore'
                                    ),
                                ),
                            ),
                        );

                        // Return all those traits that are on any equipped equipment in your inventory
                        // Uses the itemsWithThisTrait$() method of Trait that returns any equipment that has this trait.
                        return emptySafeCombineLatest(
                            nameMatchingTraits.map(trait =>
                                trait.itemNamesWithThisTrait$(creature)
                                    .pipe(
                                        map((itemNames: Array<string>) => ({ trait, itemNames })),
                                    ),
                            ),
                        )
                            .pipe(
                                map(traits => traits.filter(trait => !!trait.itemNames.length)),
                            );
                    }
                }),
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
        this._initialized$.next(true);
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

}

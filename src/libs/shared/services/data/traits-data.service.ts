import { Injectable } from '@angular/core';
import { Trait } from 'src/app/classes/Trait';
import * as json_traits from 'src/assets/json/traits';
import { Creature } from 'src/app/classes/Creature';
import { DataLoadingService } from './data-loading.service';
import { ImportedJsonFileList } from '../../definitions/types/jsonImportedItemFileList';
import { BehaviorSubject, Observable, combineLatest, map, of, switchMap } from 'rxjs';

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
                        return combineLatest(
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
        this._traits = this._dataLoadingService.loadRecastable(
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
        return Object.assign(
            new Trait(),
            { name: 'Trait not found', desc: `${ name ? name : 'The requested trait' } does not exist in the traits list.` },
        );
    }

}

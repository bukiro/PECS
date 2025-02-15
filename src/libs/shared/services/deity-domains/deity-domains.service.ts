import { Injectable } from '@angular/core';
import { Observable, switchMap, of, shareReplay, map } from 'rxjs';
import { Deity } from 'src/app/classes/deities/deity';
import { Defaults } from '../../definitions/defaults';
import { propMap$ } from '../../util/observable-utils';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';

@Injectable({
    providedIn: 'root',
})
export class DeityDomainsService {

    public effectiveMainDomains$: Observable<Array<string>>;
    public effectiveMainAlternateDomains$: Observable<Array<string>>;

    constructor(
        private readonly _characterFeatsService: CharacterFeatsService,
        _characterDeitiesService: CharacterDeitiesService,
    ) {
        this.effectiveMainDomains$ = _characterDeitiesService.mainCharacterDeity$
            .pipe(
                switchMap(deity =>
                    deity
                        ? this.effectiveDomains$(deity, true)
                        : of([]),
                ),
                shareReplay(1),
            );

        this.effectiveMainAlternateDomains$ = _characterDeitiesService.mainCharacterDeity$
            .pipe(
                switchMap(deity =>
                    deity
                        ? this.effectiveAlternateDomains$(deity, true)
                        : of([]),
                ),
                shareReplay(1),
            );
    }

    public effectiveDomains$(deity: Deity, isMainDeity?: boolean): Observable<Array<string>> {
        return (
            (isMainDeity !== undefined)
                ? of(isMainDeity)
                : propMap$(CharacterFlatteningService.characterClass$$, 'deity$')
                    .pipe(
                        map(characterDeity => deity.name === characterDeity),
                    )
        )
            .pipe(
                // If this is the main deity and you have the Splinter Faith feat, the deity's domains are replaced by that of the feat.
                // You can have the feat at any level as, by definition, it replaces the domains for previous levels as well.
                switchMap(effectiveIsMainDeity =>
                    effectiveIsMainDeity
                        ? this._characterFeatsService.characterHasFeatAtLevel$$('Splinter Faith', Defaults.maxCharacterLevel)
                            .pipe(
                                switchMap(hasSplinterFaith =>
                                    hasSplinterFaith
                                        ? CharacterFlatteningService.characterClass$$
                                            .pipe(
                                                switchMap(characterClass =>
                                                    characterClass.filteredFeatData$$(0, 0, 'Splinter Faith'),
                                                ),
                                                switchMap(featData =>
                                                    (featData[0])
                                                        ? featData[0].valueAsStringArray$('domains')
                                                        : of([]),
                                                ),
                                                map(featDomains => new Array<string>(...(featDomains ?? []))),
                                            )
                                        : of(deity.domains),
                                ),
                            )
                        : of(deity.domains),
                ),
            );
    }

    public effectiveAlternateDomains$(deity: Deity, isMainDeity?: boolean): Observable<Array<string>> {
        return (
            (isMainDeity !== undefined)
                ? of(isMainDeity)
                : propMap$(CharacterFlatteningService.characterClass$$, 'deity$')
                    .pipe(
                        map(characterDeity => deity.name === characterDeity),
                    )
        )
            .pipe(
                // If this is the main deity and you have the Splinter Faith feat, the deity's new alternate domains
                // are their domains (or alternate domains) that weren't chosen for Splinter Faith.
                // You can have the feat at any level as, by definition, it replaces the domains for previous levels as well.
                switchMap(effectiveIsMainDeity =>
                    effectiveIsMainDeity
                        ? this._characterFeatsService.characterHasFeatAtLevel$$('Splinter Faith', Defaults.maxCharacterLevel)
                            .pipe(
                                switchMap(hasSplinterFaith =>
                                    hasSplinterFaith
                                        ? CharacterFlatteningService.characterClass$$
                                            .pipe(
                                                switchMap(characterClass =>
                                                    characterClass.filteredFeatData$$(0, 0, 'Splinter Faith'),
                                                ),
                                                switchMap(featData =>
                                                    (featData[0])
                                                        ? featData[0].valueAsStringArray$('domains')
                                                        : of([]),
                                                ),
                                                map(featDomains =>
                                                    deity.domains
                                                        .concat(deity.alternateDomains)
                                                        .filter(domain => !(featDomains || []).includes(domain)),
                                                ),
                                            )
                                        : of(deity.alternateDomains),
                                ),
                            )
                        : of(deity.alternateDomains),
                ),
            );
    }

}

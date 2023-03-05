import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/Deity';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';

@Injectable({
    providedIn: 'root',
})
export class DeityDomainsService {

    constructor(
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public effectiveDomains(deity: Deity): Array<string> {
        const character = CreatureService.character;

        //Only collect the domains if $domains is empty. When this is done, the result is written into $domains.
        if (!deity.$domains.length) {
            deity.$domains = JSON.parse(JSON.stringify(deity.domains));

            if (character.class.deity === deity.name) {
                // If you have taken the Splinter Faith feat, your domains are replaced.
                // It's not necessary to filter by level, because Splinter Faith changes domains retroactively.
                const splinterFaithFeat = this._characterFeatsService.characterFeatsTaken(0, 0, { featName: 'Splinter Faith' })[0];

                if (splinterFaithFeat) {
                    character.class.filteredFeatData(0, 0, 'Splinter Faith').forEach(data => {
                        deity.$domains = JSON.parse(JSON.stringify(data.valueAsStringArray('domains') || []));
                    });
                }
            }

            deity.$domains = deity.$domains.sort();
        }

        return deity.$domains;
    }

    public effectiveAlternateDomains(deity: Deity): Array<string> {
        // Only collect the alternate domains if $alternateDomains is empty.
        // When this is done, the result is written into $alternateDomains.
        // Because some deitys don't have alternate domains, also check if $domains is the same as domains
        // - meaning that the deity's domains are unchanged and having no alternate domains is fine.
        if (!deity.$alternateDomains.length) {
            this._recreateAlternateDomains(deity);
        }

        return deity.$alternateDomains;
    }

    private _recreateAlternateDomains(deity: Deity): void {
        deity.$alternateDomains = JSON.parse(JSON.stringify(deity.alternateDomains));

        if (JSON.stringify(deity.$domains) !== JSON.stringify(deity.domains)) {
            const character = CreatureService.character;

            if (character.class.deity === deity.name) {
                // If you have taken the Splinter Faith feat, your alternate domains are replaced.
                // It's not necessary to filter by level, because Splinter Faith changes domains retroactively.
                const splinterFaithFeat = this._characterFeatsService.characterFeatsTaken(0, 0, { featName: 'Splinter Faith' })[0];

                if (splinterFaithFeat) {
                    const splinterFaithDomains: Array<string> = new Array<string>()
                        .concat(
                            ...character.class.filteredFeatData(0, 0, 'Splinter Faith')
                                .map(data => data.valueAsStringArray('domains') || []),
                        );

                    deity.$alternateDomains =
                        deity.domains.concat(deity.alternateDomains).filter(domain => !splinterFaithDomains.includes(domain));
                }
            }
        }

        deity.$alternateDomains.sort();
    }

}

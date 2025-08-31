import { computed, Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { Character } from 'src/libs/shared/character/util/models/character';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { CreatureFeatsAdapter } from './creature-feats-adapter';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { DefaultCreatureFeatsAdapter } from './default-creature-feats-adapter';
import { FeatData } from '../../models/feat-data';
import { matchStringFilter, matchNumberFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

export class CharacterFeatsAdapter extends DefaultCreatureFeatsAdapter implements CreatureFeatsAdapter {

    public readonly customFeatsMap$$ = computed(() =>
        new Map<string, Feat>(this._character.customFeats().map(feat => [feat.name.toLowerCase(), feat])),
    );

    private readonly _extendCache = {
        matchesFeatReq: new Map<string, Signal<boolean>>(),
        filteredFeatData: new Map<string, Signal<Array<FeatData>>>(),
    };

    constructor(
        private readonly _character: Character, recastFns: RecastFns,
    ) {
        super(_character, _character, recastFns);
    }

    /**
     * Matches a specific featReq string, which may include multiple options or reference another creature.
     *
     * All featReqs are tested agains the character, so only the character's featsAdapter can call this function.
     */
    public matchesFeatReq$$(featReq: string, levelNumber?: number): Signal<boolean> {
        const normalizedName = featReq.toLowerCase();

        const key = `featReq=${ normalizedName }`
            + `&levelNumber=${ levelNumber ?? 'noLevel' }`;

        return cachedSignal(
            () => {
                // Some feat requirements allow multiple feats, separated by ' or '.
                // To accomodate for those cases, always split the name requirement and check for all options.
                const normalizedNameOptions = normalizedName.split(' or ');
                const familiar = this._character.class().familiar();

                const optionResults$$ = normalizedNameOptions.map(option => {
                    // Some feats requirements ask for familiar abilities instead, so we ask the familiar for them.
                    // Familiar abilities are always temporary, so if a feat is asking for them, it is likely another familiar ability.
                    // This means temporary abilities must be allowed.
                    if (stringEqualsCaseInsensitive(option, 'Familiar:', { allowPartialString: true })) {
                        const familiarOption = option.replace('familiar:', '').trim();

                        return familiar.featsAdapter.hasFeatAtLevel$$(
                            familiarOption,
                            levelNumber,
                            { includeCountAs: true },
                        );
                    }

                    return this.hasFeatAtLevel$$(
                        option,
                        levelNumber,
                        { includeCountAs: true, excludeTemporary: true });
                });

                return computed(() =>
                    optionResults$$.some(result => !!result()),
                );
            },
            { store: this._extendCache.matchesFeatReq, key },
        );
    }

    /**
     * Gets featdata for a specific feat and source in a specific level range.
     *
     * @param minLevel
     * @param maxLevel
     * @param featName
     * @param sourceId
     * @returns
     */
    public filteredFeatData$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: {
            featName?: string;
            sourceId?: string;
        },
    ): Signal<Array<FeatData>> {
        const key = `minLevelNumber=${ minLevelNumber }`
            + `&maxLevelNumber=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return cachedSignal(
            () => computed(() =>
                this._character.class().featData()
                    .filter(data =>
                        matchStringFilter({ value: data.featName, match: filter.featName })
                        && matchStringFilter({ value: data.sourceId, match: filter.sourceId })
                        && matchNumberFilter({ value: data.level, min: minLevelNumber, max: maxLevelNumber }),
                    ),
            ),
            { store: this._extendCache.filteredFeatData, key },
        );
    }
}

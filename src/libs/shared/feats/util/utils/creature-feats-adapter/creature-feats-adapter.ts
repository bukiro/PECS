import { Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { FeatGain } from '../../models/feat-gain';
import { FeatGainFilter, FeatGainFilterOptions } from '../../models/feat-gain-filter';
import { FeatFilter, FeatFilterOptions } from '../../models/feat-filter';
import { FeatRequirementsAdapter } from '../feat-requirements-adapter/feat-requirements.adapter';

export abstract class CreatureFeatsAdapter {
    public abstract featRequirementsAdapter: FeatRequirementsAdapter;

    public abstract feats$$(
        filter: FeatFilter,
        options: FeatFilterOptions,
    ): Signal<Array<Feat>>;

    public abstract featsWithContext$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter?: FeatGainFilter,
        options?: FeatGainFilterOptions,
    ): Signal<Array<{ levelNumber: number; gain: FeatGain }>>;

    public abstract featGains$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter?: FeatGainFilter,
        options?: FeatGainFilterOptions,
    ): Signal<Array<FeatGain>>;

    /**
     * List all feats that the creature has at this level, including those taken at lower levels.
     */
    public abstract featsAtLevel$$(
        levelNumber?: number,
        options?: { excludeTemporary?: boolean }
    ): Signal<Array<Feat>>;

    /**
     * List all feats that the creature has taken at this exact level, not including those taken at lower levels.
     */
    public abstract featsTakenAtLevel$$(
        levelNumber?: number,
        options?: { excludeTemporary?: boolean }
    ): Signal<Array<Feat>>;

    /**
     * Tell whether the creature has a feat by the given name at the given level, including those taken at lower levels.
     * If allowCountAs is true, also count those feats that have the given name in their countAsFeat or their superType field.
     */
    public abstract hasFeatAtLevel$$(
        name: string,
        levelNumber?: number,
        options?: FeatGainFilterOptions,
    ): Signal<number>;

    /**
     * Tell whether the creature has taken a feat by the given name at the exact given level, not including those taken at lower levels.
     */
    public abstract hasTakenFeatAtLevel$$(
        name: string,
        levelNumber: number,
        options: { excludeTemporary?: boolean }
    ): Signal<number>;
}

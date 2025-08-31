import { Feat } from '../models/feat';
import { matchBooleanFilter, matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { isTruthy } from 'src/libs/shared/common/util/utils/type-guard-utils';
import { FeatGain } from '../models/feat-gain';
import { FeatFilter, FeatFilterOptions } from '../models/feat-filter';
import { FeatGainFilter } from '../models/feat-gain-filter';

export const featFilter = (
    filter: FeatFilter = {},
    options: FeatFilterOptions = {},
): (feat: Feat) => boolean =>
    feat =>
        matchStringFilter({
            value: [
                feat.name,
                options.includeSubTypes ? feat.superType : undefined,
                options.includeCountAs ? feat.countAsFeat : undefined,
            ].filter(isTruthy),
            match: filter.name,
        })
        && matchStringFilter({ value: feat.traits, match: filter.type });

export const featGainFilter = (
    filter: FeatGainFilter = {},
    options: { includeCountAs?: boolean },
): (gain: FeatGain) => boolean =>
    gain =>
        matchStringFilter({
            value: [
                gain.name,
                ...(
                    options.includeCountAs
                        ? [
                            gain.originalFeat$$().countAsFeat,
                            gain.originalFeat$$().superType,
                        ]
                        : []
                ),
            ].filter(isTruthy),
            match: filter.featName,
        })
        && matchStringFilter({ value: gain.source, match: filter.source })
        && matchStringFilter({ value: gain.sourceId, match: filter.sourceId })
        && matchBooleanFilter({ value: gain.locked, match: filter.locked })
        && matchBooleanFilter({ value: gain.automatic, match: filter.automatic });

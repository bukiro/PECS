import { computed, Signal, signal } from '@angular/core';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { ComplexValueResult, DomainValueBasicProps } from 'src/libs/shared/evaluation/util/models/complex-value';
import { ComplexValueCommonAdapter } from 'src/libs/shared/evaluation/util/utils/complex-value-adapter/complex-value-common-adapter';
import { determineCreature$$ } from 'src/libs/shared/evaluation/util/utils/complex-value-utils';
import { FeatRequirements as FRQs } from 'src/libs/shared/feats/util/models/feat-requirements';
import {
    isComplexRequirementAlwaysTrue,
    isComplexRequirementHasThisFeat,
} from 'src/libs/shared/feats/util/utils/feat-requirements-type-utils';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

const successSignal = signal({ met: true, value: 0 }).asReadonly();
const failSignal = signal({ met: false, value: 0 }).asReadonly();

const keyFromContext = (context: FRQs.ComplexRequirementContext): string =>
    `feat=${ context.feat.name }`
    + `&charLevel=${ context.charLevel }`
    + `&excludeTemporary=${ context.excludeTemporary }`;

function replaceNames(list: string, { feat }: FRQs.ComplexRequirementContext): Array<string> {
    const subType = feat.subType.toLowerCase();

    return Array.from(new Set(
        list
            .split(',')
            .map(name => name.trim())
            .map(name => stringEqualsCaseInsensitive(name, 'subtype') ? subType : name),
    ));
}

export class ComplexFeatRequirementsAdapter {

    private readonly _cache = {
        resolveHasThisFeat: new WeakMap<FRQs.ComplexRequirementHasThisFeat, Map<string, Signal<ComplexValueResult>>>(),
    };

    private readonly _complexValueCommonAdapter: ComplexValueCommonAdapter<FRQs.ComplexRequirement, FRQs.ComplexRequirementContext>;

    constructor(
        recastFns: RecastFns,
    ) {
        this._complexValueCommonAdapter = new ComplexValueCommonAdapter(recastFns, this.resolveComplexReq$$.bind(this), replaceNames);
    }

    public resolveComplexReq$$(
        complexReq: FRQs.ComplexRequirement,
        context: FRQs.ComplexRequirementContext,
    ): Signal<ComplexValueResult> {
        if (isComplexRequirementAlwaysTrue(complexReq)) {
            return this.resolveAlwaysTrue$$(complexReq);
        }

        if (isComplexRequirementHasThisFeat(complexReq)) {
            return this.resolveHasThisFeat$$(complexReq, context);
        }

        return this._complexValueCommonAdapter.resolveComplexValue$$(complexReq, context);
    }

    public resolveAlwaysTrue$$(
        complexReq: FRQs.ComplexRequirementAlwaysTrue,
    ): Signal<ComplexValueResult> {
        return complexReq.alwaysTrue
            ? successSignal
            : failSignal;
    }

    public resolveHasThisFeat$$(
        complexReq: FRQs.ComplexRequirementHasThisFeat & DomainValueBasicProps,
        context: FRQs.ComplexRequirementContext,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const hasThisFeat = complexReq.hasThisFeat;

                const creature$$ = determineCreature$$(complexReq, context);

                const hasThisFeat$$ = computed(() =>
                    creature$$().featsAdapter.hasFeatAtLevel$$(
                        context.feat.name,
                        context.charLevel,
                        { excludeTemporary: context.excludeTemporary },
                    ),
                );

                return computed(() =>
                    hasThisFeat === !!hasThisFeat$$()()
                        ? { met: true, value: 0 }
                        : { met: false, value: 0 },
                );
            },
            { store: this._cache.resolveHasThisFeat, objKey: complexReq, key: keyFromContext(context) },
        );

    }
}

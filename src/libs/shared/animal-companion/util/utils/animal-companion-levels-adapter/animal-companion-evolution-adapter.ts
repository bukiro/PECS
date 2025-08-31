import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { AnimalCompanionStage } from '../../models/animal-companion-stage';
import { computed, Signal } from '@angular/core';
import { AnimalCompanionSpecialization } from 'src/libs/shared/feats/util/models/animal-companion-specialization';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { matchNumberFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';

export class AnimalCompanionEvolutionAdapter {

    private readonly _cache = {
        availableStages: new Map<string, Signal<Array<AnimalCompanionStage>>>(),
        availableSpecializations: new Map<string, Signal<Array<AnimalCompanionSpecialization>>>(),
    };

    constructor(
        private readonly _companion: AnimalCompanion,
        private readonly _character: Character,
    ) { }

    /**
     * Determine all animal companion stages that are available at the given character level.
     * The stages depend entirely on character feats,
     * so they can be derived from the companion-gaining feats that name them.
     */
    public availableStages$$(minLevelNumber?: number, maxLevelNumber?: number): Signal<Array<AnimalCompanionStage>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`;

        return cachedSignal(
            () => {
                const characterFeats$$ = this._character.featsAdapter.featsWithContext$$({ minLevelNumber, maxLevelNumber });

                return computed(() => {
                    const companionGainingEvolutionFeats = characterFeats$$().filter(({ feat }) => feat.gainAnimalCompanion);
                    const stages = Object.fromEntries(this._companion.class().stages$$()
                        .map(stage => [stage.name, stage]));

                    return companionGainingEvolutionFeats
                        .map(({ feat }) => stages[feat.gainAnimalCompanion])
                        .filter(isDefined);
                });
            },
            { store: this._cache.availableStages, key },
        );
    }

    /**
     * Determine all specializations that are available at the given character level.
     * Every specialization is marked with the character level where it has been taken,
     * so they can be filtered by that.
     */
    public availableSpecializations$$(minLevelNumber?: number, maxLevelNumber?: number): Signal<Array<AnimalCompanionSpecialization>> {
        const key = `${ minLevelNumber } to ${ maxLevelNumber }`;

        return cachedSignal(
            () => {
                const effectiveMaxLevel$$ = this._companion.levelOrCurrent$$(maxLevelNumber);

                return computed(() => {
                    const effectiveMaxLevel = effectiveMaxLevel$$();

                    return this._companion.class().specializations()
                        .filter(spec => matchNumberFilter({ value: spec.level, min: minLevelNumber, max: effectiveMaxLevel }));
                });
            },
            { store: this._cache.availableSpecializations, key },
        );
    }
}

import { computed, Signal } from '@angular/core';
import { CreatureSizes } from '../../models/creature-sizes';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { CreatureSizeAdapter } from './creature-size-adapter';
import { applySizeChange, legalSize } from '../creature-size-utils';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';

export class AnimalCompanionSizeAdapter extends CreatureSizeAdapter {

    public readonly baseSize$$: Signal<ResultWithBonuses<number>>;

    constructor(
        private readonly _companion: AnimalCompanion,
    ) {
        super(_companion);

        this.baseSize$$ = (() => {
            const stages$$ = this._companion.evolutionAdapter.availableStages$$();

            return computed(() => {
                const ancestry = this._companion.class().ancestry();

                const ancestrySize = ancestry.size ?? CreatureSizes.Medium;

                // Starting with the ancestry size,
                // add up any size changes from the evolutionary stages.
                // No stage can raise the size above Large.
                return stages$$()
                    .reduce(
                        ({ result, bonuses }, stage) => {

                            if (stage.sizeChange) {
                                const newSize = Math.max(
                                    Math.min(
                                        result + stage.sizeChange,
                                        CreatureSizes.Large,
                                    ),
                                    CreatureSizes.Tiny,
                                );

                                return applySizeChange({
                                    change: legalSize(newSize),
                                    title: stage.name,
                                    bonuses,
                                });
                            }

                            return { result, bonuses };
                        },
                        applySizeChange({
                            change: ancestrySize,
                            title: 'Ancestry Base Size',
                            bonuses: [],
                        }),
                    );
            });
        })();
    }

}

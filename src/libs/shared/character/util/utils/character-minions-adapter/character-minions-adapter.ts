import { Signal, computed } from '@angular/core';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { Character } from '../../models/character';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';

export class CharacterMinionsAdapter {

    public readonly animalCompanion$$: Signal<AnimalCompanion> = computed(() =>
        this._character
            .class()
            .animalCompanion(),
    );

    public readonly familiar$$: Signal<Familiar> = computed(() =>
        this._character
            .class()
            .familiar(),
    );

    private readonly _cache = {
        isCompanionAvailable: new Map<number | string, Signal<boolean>>(),
        isFamiliarAvailable: new Map<number | string, Signal<boolean>>(),
        allAvailableCreatures: new Map<number | string, Signal<Array<Creature>>>(),
        companionIfAvailable: new Map<number | string, Signal<AnimalCompanion | undefined>>(),
        familiarIfAvailable: new Map<number | string, Signal<Familiar | undefined>>(),
    };

    constructor(private readonly _character: Character) { }

    public isCompanionAvailable$$(levelNumber?: number): Signal<boolean> {
        //Return whether any feat that you own grants a young animal companion at the given level or the current character level.
        return cachedSignal(
            () => {
                const effectiveLevelNumber$$ = this._character.levelOrCurrent$$(levelNumber);

                const allFeats$$ = computed(() =>
                    this._character.featsAdapter.featsAtLevel$$(effectiveLevelNumber$$()),
                );

                return computed(() =>
                    allFeats$$()().some(({ gainAnimalCompanion }) => stringEqualsCaseInsensitive(gainAnimalCompanion, 'Young')),
                );
            },
            {
                store: this._cache.isCompanionAvailable, key: levelNumber ?? 'noLevel',
            },
        );
    }

    public isFamiliarAvailable$$(levelNumber?: number): Signal<boolean> {
        //Return whether any feat that you own grants a familiar at the given level or the current character level.
        return cachedSignal(
            () => {
                const effectiveLevelNumber$$ = this._character.levelOrCurrent$$(levelNumber);

                const allFeats$$ = computed(() =>
                    this._character.featsAdapter.featsAtLevel$$(effectiveLevelNumber$$()),
                );

                return computed(() =>
                    allFeats$$()().some(({ gainFamiliar }) => gainFamiliar),
                );
            },
            { store: this._cache.isFamiliarAvailable, key: levelNumber ?? 'noLevel' },
        );
    }

    public companionIfAvailable$$(levelNumber?: number): Signal<AnimalCompanion | undefined> {
        return cachedSignal(
            () => {
                const isCompanionAvailable$$ = this.isCompanionAvailable$$(levelNumber);

                return computed(
                    () => isCompanionAvailable$$()
                        ? this.animalCompanion$$()
                        : undefined,
                );
            },
            { store: this._cache.companionIfAvailable, key: levelNumber ?? 'noLevel' },
        );
    }

    public familiarIfAvailable$$(levelNumber?: number): Signal<Familiar | undefined> {
        return cachedSignal(
            () => {
                const isFamiliarAvailable$$ = this.isFamiliarAvailable$$(levelNumber);

                return computed(
                    () => isFamiliarAvailable$$()
                        ? this.familiar$$()
                        : undefined,
                );
            },
            { store: this._cache.familiarIfAvailable, key: levelNumber ?? 'noLevel' },
        );
    }

    public allAvailableCreatures$$(levelNumber?: number): Signal<Array<Creature>> {
        return cachedSignal(
            () => {
                const companionIfAvailable$$ = this.companionIfAvailable$$(levelNumber);
                const familiarIfAvailable$$ = this.familiarIfAvailable$$(levelNumber);

                return computed(
                    () => new Array<Creature>(
                        ...[
                            this._character,
                            companionIfAvailable$$(),
                            familiarIfAvailable$$(),
                        ].filter(isDefined),
                    ),
                );
            },
            { store: this._cache.allAvailableCreatures, key: levelNumber ?? 'noLevel' },
        );
    }

}

import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Deity } from '../../models/deity';
import { computed, signal, Signal } from '@angular/core';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export class CharacterDeityDomainsAdapter {

    private readonly _cache = {
        effectiveDomains: new WeakMap<Deity, Signal<Array<string>>>(),
        effectiveAlternateDomains: new WeakMap<Deity, Signal<Array<string>>>(),
    };

    constructor(
        private readonly _character: Character,
    ) { }

    public effectiveDomains$$(deity: Deity, isMainDeity?: boolean): Signal<Array<string>> {
        return weaklyCachedSignal(
            () => {
                const isEffectiveMainDeity$$ = isMainDeity !== undefined
                    ? signal(isMainDeity)
                    : computed(() => stringEqualsCaseInsensitive(this._character.class().deity(), deity.name));

                // If this is the main deity and you have the Splinter Faith feat, the deity's domains are replaced by that of the feat.
                // You can have the feat at any level as, by its description, it replaces the domains for previous levels as well.
                const hasSplinterFaith$$ = this._character.featsAdapter.hasFeatAtLevel$$('Splinter Faith', Defaults.maxCharacterLevel);

                const splinterFaithData$$ =
                    this._character.featsAdapter.filteredFeatData$$(
                        { maxLevelNumber: Defaults.maxCharacterLevel },
                        { featName: 'Splinter Faith' },
                    );

                const splinterFaithDomains$$ = computed(() => {
                    const splinterFaithData = splinterFaithData$$()[0];

                    if (!splinterFaithData) {
                        return signal([]).asReadonly();
                    }

                    return splinterFaithData.valueAsStringArray$$('domains');
                });

                return computed(() => {
                    const isEffectiveMainDeity = isEffectiveMainDeity$$();

                    if (!isEffectiveMainDeity) {
                        return deity.domains;
                    }

                    const hasSplinterFaith = hasSplinterFaith$$();

                    if (!hasSplinterFaith) {
                        return deity.domains;
                    }

                    return [...(splinterFaithDomains$$()() ?? [])];
                });
            },
            { store: this._cache.effectiveDomains, objKey: deity },
        );
    }

    public effectiveAlternateDomains$$(deity: Deity, isMainDeity?: boolean): Signal<Array<string>> {
        return weaklyCachedSignal(
            () => {
                const isEffectiveMainDeity$$ = isMainDeity !== undefined
                    ? signal(isMainDeity)
                    : computed(() => stringEqualsCaseInsensitive(this._character.class().deity(), deity.name));

                // If this is the main deity and you have the Splinter Faith feat, the deity's new alternate domains
                // are their domains (or alternate domains) that weren't chosen for Splinter Faith.
                // You can have the feat at any level as, by definition, it replaces the domains for previous levels as well.
                const hasSplinterFaith$$ = this._character.featsAdapter.hasFeatAtLevel$$('Splinter Faith', Defaults.maxCharacterLevel);

                const splinterFaithData$$ =
                    this._character.featsAdapter.filteredFeatData$$(
                        { maxLevelNumber: Defaults.maxCharacterLevel },
                        { featName: 'Splinter Faith' },
                    );

                const splinterFaithDomains$$ = computed(() => {
                    const splinterFaithData = splinterFaithData$$()[0];

                    if (!splinterFaithData) {
                        return signal([]).asReadonly();
                    }

                    return splinterFaithData.valueAsStringArray$$('domains');
                });

                return computed(() => {
                    const isEffectiveMainDeity = isEffectiveMainDeity$$();

                    if (!isEffectiveMainDeity) {
                        return deity.alternateDomains;
                    }

                    const hasSplinterFaith = hasSplinterFaith$$();

                    if (!hasSplinterFaith) {
                        return deity.alternateDomains;
                    }

                    const splinterFaithDomains = splinterFaithDomains$$()() ?? [];

                    return [
                        ...deity.domains,
                        ...deity.alternateDomains,
                    ].filter(domain => !stringsIncludeCaseInsensitive(splinterFaithDomains, domain));
                });
            },
            { store: this._cache.effectiveAlternateDomains, objKey: deity },
        );
    }

}

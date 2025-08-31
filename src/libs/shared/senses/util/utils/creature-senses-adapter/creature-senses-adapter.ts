import { computed, Signal } from '@angular/core';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { CreatureInherentSensesAdapter } from '../creature-inherent-senses-adapter/creature-inherent-senses-adapter';
import { FamiliarInherentSensesAdapter } from '../creature-inherent-senses-adapter/familiar-inherent-senses-adapter';
import { AnimalCompanionInherentSensesAdapter } from '../creature-inherent-senses-adapter/animal-companion-inherent-senses-adapter';
import { CharacterInherentSensesAdapter } from '../creature-inherent-senses-adapter/character-inherent-senses-adapter';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export class CreatureSensesAdapter {

    private readonly _sensesFromItems$$: Signal<Array<string>> = computed(() =>
        this._creature.mainInventory$$().activeEquipment$$()
            .flatMap(({ gainSenses }) => gainSenses),
    );

    private readonly _cache = {
        senses: new Map<string, Signal<Array<string>>>(),
    };

    private readonly _inherentSensesAdapter$$: CreatureInherentSensesAdapter;

    constructor(
        private readonly _creature: Character | Familiar | AnimalCompanion,
    ) {
        if (_creature.isFamiliar()) {
            this._inherentSensesAdapter$$ = new FamiliarInherentSensesAdapter(_creature);
        } else if (_creature.isAnimalCompanion()) {
            this._inherentSensesAdapter$$ = new AnimalCompanionInherentSensesAdapter(_creature);
        } else {
            this._inherentSensesAdapter$$ = new CharacterInherentSensesAdapter(_creature);
        }
    }

    public senses$$(
        charLevel?: number,
        options: { excludeTemporary?: boolean } = {},
    ): Signal<Array<string>> {
        const key = `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const feats$$ = this._creature.featsAdapter.featsAtLevel$$(charLevel, options);
                const conditions$$ = this._creature.conditionsAdapter.appliedConditions$$();

                return computed(() => {
                    const inherentSenses = this._inherentSensesAdapter$$.inherentSenses$$();
                    const sensesFromFeats = feats$$().flatMap(feat => feat.senses);
                    const conditionSenseGains = options.excludeTemporary
                        ? []
                        : conditions$$().flatMap(({ gain }) => gain.appliedSenses$$());
                    const sensesfromItems = options.excludeTemporary
                        ? []
                        : this._sensesFromItems$$();

                    const sensesFromConditions = conditionSenseGains.filter(({ excluding }) => !excluding).map(({ name }) => name);
                    const conditionSenseSubtractions = conditionSenseGains.filter(({ excluding }) => !excluding).map(({ name }) => name);

                    return Array.from(new Set(
                        [
                            ...inherentSenses,
                            ...sensesFromFeats,
                            ...sensesFromConditions,
                            ...sensesfromItems,
                        ].filter(sense => !stringsIncludeCaseInsensitive(conditionSenseSubtractions, sense)),
                    ));
                });
            },
            { store: this._cache.senses, key },
        );
    }

}

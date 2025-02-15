import { computed, inject, Injectable, Signal } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureService } from '../creature/creature.service';
import { isDefined } from '../../util/type-guard-utils';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { FeatsStore } from 'src/libs/store/feats/feats.store';

@Injectable({
    providedIn: 'root',
})
export class CreatureAvailabilityService {

    private readonly _featsStore = inject(FeatsStore);

    public isCompanionAvailable$$(levelNumber?: number): Signal<boolean> {
        //Return whether any feat that you own grants an animal companion at the given level or the current character level.
        return computed(() => {
            const resultantLevelNumber = CharacterFlatteningService.levelOrCurrent$$(levelNumber)();

            return this._featsStore
                .allCharacterFeatsAtLevel(resultantLevelNumber)()
                .some(feat => feat.gainAnimalCompanion === 'Young');
        });
    }

    public isFamiliarAvailable$$(levelNumber?: number): Signal<boolean> {
        //Return whether any feat that you own grants a familiar at the given level or the current character level.
        return computed(() => {
            const resultantLevelNumber = CharacterFlatteningService.levelOrCurrent$$(levelNumber)();

            return this._featsStore
                .allCharacterFeatsAtLevel(resultantLevelNumber)()
                .some(feat => feat.gainFamiliar);
        });
    }

    public allAvailableCreatures$$(levelNumber?: number): Signal<Array<Creature>> {
        return computed(() => [
            CreatureService.character$$(),
            this.companionIfAvailable$$(levelNumber)(),
            this.familiarIfAvailable$$(levelNumber)(),
        ].filter(isDefined));
    }

    public companionIfAvailable$$(levelNumber?: number): Signal<AnimalCompanion | undefined> {
        return computed(() =>
            this.isCompanionAvailable$$(levelNumber)
                ? CreatureService.companion$$()
                : undefined,
        );
    }

    public familiarIfAvailable$$(levelNumber?: number): Signal<Familiar | undefined> {
        return computed(() =>
            this.isFamiliarAvailable$$(levelNumber)
                ? CreatureService.familiar$$()
                : undefined,
        );
    }
}

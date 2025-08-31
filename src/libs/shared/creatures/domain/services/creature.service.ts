import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { StatusStore } from 'src/libs/shared/app-status/domain/stores/status.store';
import { AppStore } from 'src/libs/shared/app-status/domain/stores/app.store';
import { ApiStatusKey } from 'src/libs/shared/api/util/models/api-status-key';
import { AnimalCompanion } from '../../util/models/animal-companion';
import { Character } from '../../../character/util/models/character';
import { CreatureTypes } from '../../util/models/creature-types';
import { Familiar } from '../../util/models/familiar';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureService {

    public static readonly character$$: Signal<Character> = computed(() =>
        CreatureService._character(),
    );

    private static readonly _character = signal<Character>(new Character(RecastService.recastFns));

    private readonly _appStore = inject(AppStore);
    private readonly _statusStore = inject(StatusStore);

    public static creatureFromType$$(type: CreatureTypes): Signal<Character | AnimalCompanion | Familiar> {
        switch (type) {
            case CreatureTypes.AnimalCompanion:
                return computed(() => CreatureService.character$$().minionsAdapter.animalCompanion$$());
            case CreatureTypes.Familiar:
                return computed(() => CreatureService.character$$().minionsAdapter.familiar$$());
            default:
                return CreatureService.character$$;
        }
    }

    public setCharacter(character: Character, gmMode?: boolean): void {
        this._appStore.resetCharacter({ gmMode });

        CreatureService._character.set(character);
    }

    public closeCharacter(): void {
        this._statusStore.setCharacterStatus({ key: ApiStatusKey.NoCharacter });
    }

}

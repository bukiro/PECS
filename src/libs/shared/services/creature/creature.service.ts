import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ApiStatusKey } from '../../definitions/api-status-key';
import { Store } from '@ngrx/store';
import { setCharacterStatus } from 'src/libs/store/status/status.actions';
import { resetCharacter } from 'src/libs/store/character/character.actions';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { FeatsStore } from 'src/libs/store/feats/feats.store';
import { Creature } from 'src/app/classes/creatures/creature';

@Injectable({
    providedIn: 'root',
})
export class CreatureService {

    private static readonly _character = signal<Character>(new Character());
    private static _character$$?: Signal<Character>;
    private static _companion$$?: Signal<AnimalCompanion>;
    private static _familiar$$?: Signal<Familiar>;

    private readonly _featsStore = inject(FeatsStore);

    constructor(
        private readonly _store$: Store,
    ) { }

    public static get character$$(): Signal<Character> {
        if (!CreatureService._character$$) {
            CreatureService._character$$ = CreatureService._character.asReadonly();
        }

        return CreatureService._character$$;
    }

    public static get companion$$(): Signal<AnimalCompanion> {
        if (!CreatureService._companion$$) {
            CreatureService._companion$$ = computed(() =>
                CreatureService
                    .character$$()
                    .class()
                    .animalCompanion(),
            );
        }

        return CreatureService._companion$$;
    }

    public static get familiar$$(): Signal<Familiar> {
        if (!CreatureService._familiar$$) {
            CreatureService._familiar$$ = computed(() =>
                CreatureService
                    .character$$()
                    .class()
                    .familiar(),
            );
        }

        return CreatureService._familiar$$;
    }

    public static creatureFromType$$(type: CreatureTypes): Signal<Character | AnimalCompanion | Familiar> {
        switch (type) {
            case CreatureTypes.AnimalCompanion:
                return CreatureService.companion$$;
            case CreatureTypes.Familiar:
                return CreatureService.familiar$$;
            default:
                return CreatureService.character$$;
        }
    }

    public static doesCreatureExist$$(creature: Creature): Signal<boolean> {
        return computed(() => CreatureService.creatureFromType$$(creature.type)() === creature);
    }

    public resetCharacter(character: Character, gmMode?: boolean): void {
        this._store$.dispatch(resetCharacter({ gmMode }));
        this._featsStore.reset();

        CreatureService._character.set(character);
    }

    public closeCharacter(): void {
        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.NoCharacter } }));
    }

}

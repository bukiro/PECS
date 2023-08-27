import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { ApiStatusKey } from '../../definitions/apiStatusKey';
import { Store } from '@ngrx/store';
import { setCharacterStatus } from 'src/libs/store/status/status.actions';
import { resetCharacter } from 'src/libs/store/character/character.actions';

@Injectable({
    providedIn: 'root',
})
export class CreatureService {

    public static character$: BehaviorSubject<Character>;
    public static companion$: Observable<AnimalCompanion>;
    public static familiar$: Observable<Familiar>;

    constructor(
        private readonly _store$: Store,
    ) {
        CreatureService.character$ = new BehaviorSubject<Character>(new Character());
        CreatureService.companion$ = CreatureService.character$
            .pipe(
                switchMap(character => character.class$),
                switchMap(characterClass => characterClass.animalCompanion$),
            );
        CreatureService.familiar$ = CreatureService.character$
            .pipe(
                switchMap(character => character.class$),
                switchMap(characterClass => characterClass.familiar$),
            );
    }

    public static get character(): Character {
        return CreatureService.character$.getValue();
    }

    public static creatureFromType$(type: CreatureTypes): Observable<Character | AnimalCompanion | Familiar> {
        switch (type) {
            case CreatureTypes.AnimalCompanion:
                return CreatureService.companion$;
            case CreatureTypes.Familiar:
                return CreatureService.familiar$;
            default:
                return CreatureService.character$;
        }
    }

    public resetCharacter(character: Character, gmMode?: boolean): void {
        this._store$.dispatch(resetCharacter({ gmMode }));

        CreatureService.character$.next(character);
    }

    public closeCharacter(): void {
        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.NoCharacter } }));
    }

}

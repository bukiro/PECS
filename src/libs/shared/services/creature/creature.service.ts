import { Injectable } from '@angular/core';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { ApiStatusKey } from '../../definitions/apiStatusKey';
import { Store } from '@ngrx/store';
import { setCharacterStatus } from 'src/libs/store/status/status.actions';
import { resetCharacter } from 'src/libs/store/character/character.actions';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';

@Injectable({
    providedIn: 'root',
})
export class CreatureService {

    private static readonly _characterSubject$ = new BehaviorSubject<Character>(new Character());
    private static _character$?: Observable<Character>;
    private static _companion$?: Observable<AnimalCompanion>;
    private static _familiar$?: Observable<Familiar>;

    constructor(
        private readonly _store$: Store,
    ) { }

    public static get character$(): Observable<Character> {
        if (!CreatureService._character$) {
            CreatureService._character$ = CreatureService._characterSubject$.asObservable();
        }

        return CreatureService._character$;
    }

    public static get character(): Character {
        return CreatureService._characterSubject$.value;
    }

    public static get companion$(): Observable<AnimalCompanion> {
        if (!CreatureService._companion$) {
            CreatureService._companion$ = CreatureService.character$
                .pipe(
                    switchMap(character => character.class$),
                    switchMap(characterClass => characterClass.animalCompanion$),
                );
        }

        return CreatureService._companion$;
    }

    public static get familiar$(): Observable<Familiar> {
        if (!CreatureService._familiar$) {
            CreatureService._familiar$ = CreatureService.character$
                .pipe(
                    switchMap(character => character.class$),
                    switchMap(characterClass => characterClass.familiar$),
                );
        }

        return CreatureService._familiar$;
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

        CreatureService._characterSubject$.next(character);
    }

    public closeCharacter(): void {
        this._store$.dispatch(setCharacterStatus({ status: { key: ApiStatusKey.NoCharacter } }));
    }

}

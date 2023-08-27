import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { Class } from 'src/app/classes/Class';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { CreatureService } from '../creature/creature.service';

@Injectable({
    providedIn: 'root',
})
/**
 * This service provides some switchMaps based on the character that are often needed.
 * More may be added liberally as long as it saves duplicate code.
 */
export class CharacterFlatteningService {

    public static characterLevel$: Observable<number>;
    public static characterClass$: Observable<Class>;
    public static characterSpellCasting$: Observable<Array<SpellCasting>>;
    public static characterFocusPoints$: Observable<number>;

    constructor() {
        CharacterFlatteningService.characterLevel$ = CreatureService.character$
            .pipe(
                switchMap(character => character.level$),
            );

        CharacterFlatteningService.characterClass$ = CreatureService.character$
            .pipe(
                switchMap(character => character.class$),
            );

        CharacterFlatteningService.characterSpellCasting$ = CharacterFlatteningService.characterClass$
            .pipe(
                switchMap(characterClass => characterClass.spellCasting.values$),
            );

        CharacterFlatteningService.characterFocusPoints$ = CharacterFlatteningService.characterClass$
            .pipe(
                switchMap(characterClass => characterClass.focusPoints$),
            );
    }

    public static levelOrCurrent$(levelNumber?: number): Observable<number> {
        return levelNumber
            ? of(levelNumber)
            : CharacterFlatteningService.characterLevel$;
    }

}

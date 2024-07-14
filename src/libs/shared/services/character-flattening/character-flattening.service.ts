import { Injectable } from '@angular/core';
import { Observable, switchMap, of } from 'rxjs';
import { CharacterClass } from 'src/app/classes/creatures/character/character-class';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { CreatureService } from '../creature/creature.service';

@Injectable({
    providedIn: 'root',
})
/**
 * This service provides some switchMaps based on the character that are often needed.
 * More may be added liberally as long as it saves duplicate code.
 */
export class CharacterFlatteningService {

    private static _characterLevel$?: Observable<number>;
    private static _characterClass$?: Observable<CharacterClass>;
    private static _characterSpellCasting$?: Observable<Array<SpellCasting>>;
    private static _characterFocusPoints$?: Observable<number>;

    public static get characterLevel$(): Observable<number> {
        if (!CharacterFlatteningService._characterLevel$) {
            CharacterFlatteningService._characterLevel$ = CreatureService.character$
                .pipe(
                    switchMap(character => character.level$),
                );
        }

        return CharacterFlatteningService._characterLevel$;
    }

    public static get characterClass$(): Observable<CharacterClass> {
        if (!CharacterFlatteningService._characterClass$) {
            CharacterFlatteningService._characterClass$ = CreatureService.character$
                .pipe(
                    switchMap(character => character.class$),
                );
        }

        return CharacterFlatteningService._characterClass$;
    }

    public static get characterSpellCasting$(): Observable<Array<SpellCasting>> {
        if (!CharacterFlatteningService._characterSpellCasting$) {
            CharacterFlatteningService._characterSpellCasting$ = CharacterFlatteningService.characterClass$
                .pipe(
                    switchMap(characterClass => characterClass.spellCasting.values$),
                );
        }

        return CharacterFlatteningService._characterSpellCasting$;
    }

    public static get characterFocusPoints$(): Observable<number> {
        if (!CharacterFlatteningService._characterFocusPoints$) {
            CharacterFlatteningService._characterFocusPoints$ = CharacterFlatteningService.characterClass$
                .pipe(
                    switchMap(characterClass => characterClass.focusPoints$),
                );
        }

        return CharacterFlatteningService._characterFocusPoints$;
    }

    public static levelOrCurrent$(levelNumber?: number): Observable<number> {
        return levelNumber
            ? of(levelNumber)
            : CharacterFlatteningService.characterLevel$;
    }

}

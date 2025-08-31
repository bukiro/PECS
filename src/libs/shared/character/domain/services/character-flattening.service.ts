import { computed, Injectable, signal, Signal } from '@angular/core';
import { CreatureService } from '../../../creatures/domain/services/creature.service';

@Injectable({
    providedIn: 'root',
})
/**
 * This service provides some switchMaps based on the character that are often needed.
 * More may be added liberally as long as it saves duplicate code.
 */
export class CharacterFlatteningService {

    public static characterLevel$$ = computed(() =>
        CreatureService
            .character$$()
            .level(),
    );

    public static characterClass$$ = computed(() =>
        CreatureService
            .character$$()
            .class(),
    );

    public static characterSpellCasting$$ = computed(() =>
        CharacterFlatteningService
            .characterClass$$()
            .spellCasting(),
    );


    public static characterFocusPoints$$ = computed(() =>
        CharacterFlatteningService
            .characterClass$$()
            .focusPoints(),
    );

    public static levelOrCurrent$$(levelNumber?: number): Signal<number> {
        return levelNumber
            ? signal(levelNumber).asReadonly()
            : CharacterFlatteningService.characterLevel$$;
    }

}

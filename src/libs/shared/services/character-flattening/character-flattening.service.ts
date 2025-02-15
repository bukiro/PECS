import { computed, Injectable, signal, Signal } from '@angular/core';
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

    private static _characterLevel$$?: Signal<number>;
    private static _characterClass$$?: Signal<CharacterClass>;
    private static _characterSpellCasting$$?: Signal<Array<SpellCasting>>;
    private static _characterFocusPoints$$?: Signal<number>;

    public static get characterLevel$$(): Signal<number> {
        if (!CharacterFlatteningService._characterLevel$$) {
            CharacterFlatteningService._characterLevel$$ = computed(() =>
                CreatureService
                    .character$$()
                    .level(),
            );
        }

        return CharacterFlatteningService._characterLevel$$;
    }

    public static get characterClass$$(): Signal<CharacterClass> {
        if (!CharacterFlatteningService._characterClass$$) {
            CharacterFlatteningService._characterClass$$ = computed(() =>
                CreatureService
                    .character$$()
                    .class(),
            );
        }

        return CharacterFlatteningService._characterClass$$;
    }

    public static get characterSpellCasting$$(): Signal<Array<SpellCasting>> {
        if (!CharacterFlatteningService._characterSpellCasting$$) {
            CharacterFlatteningService._characterSpellCasting$$ = computed(() =>
                CharacterFlatteningService
                    .characterClass$$()
                    .spellCasting(),
            );
        }

        return CharacterFlatteningService._characterSpellCasting$$;
    }

    public static get characterFocusPoints$$(): Signal<number> {
        if (!CharacterFlatteningService._characterFocusPoints$$) {
            CharacterFlatteningService._characterFocusPoints$$ = computed(() =>
                CharacterFlatteningService
                    .characterClass$$()
                    .focusPoints(),
            );
        }

        return CharacterFlatteningService._characterFocusPoints$$;
    }

    public static levelOrCurrent$$(levelNumber?: number): Signal<number> {
        return levelNumber
            ? signal(levelNumber).asReadonly()
            : CharacterFlatteningService.characterLevel$$;
    }

}

import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap, take, map, switchMap, of, combineLatest } from 'rxjs';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellCastingTypes } from '../../../../libs/shared/spells/util/models/spell-casting-types';
import { SpellTraditions } from '../../../../libs/shared/spells/util/models/spell-traditions';
import { TimePeriods } from '../../../../libs/shared/time/util/models/time-periods';
import { sortAlphaNum } from '../../../../libs/shared/common/util/utils/sort-utils';
import { stringEqualsCaseInsensitive } from '../../../../libs/shared/common/util/utils/string-utils';
import { CharacterFeatsService } from '../../../../libs/shared/feats/domain/services/character-feats.service';
import { CharacterFlatteningService } from '../../../../libs/shared/character/domain/services/character-flattening.service';
import { CreatureService } from '../../../../libs/shared/creatures/domain/services/creature.service';
import { SkillsDataService } from '../../../../libs/shared/skills/domain/services/skills-data.service';
import { InventoryService } from '../../../../libs/shared/items/domain/services/inventory.service';
import { RecastService } from '../../../../libs/shared/serialization/domain/services/recast.service';
import { CreatureSkillValueAdapter } from '../../../../libs/shared/skills/util/utils/creature-skill-value-adapter/familiar-skill-value-adapter';
import { Scroll } from 'src/app/classes/items/scroll';
import { emptySafeCombineLatest } from '../../../../libs/shared/common/util/utils/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class ScrollSavantService {

    public scrollSavantSpellCasting$: Observable<SpellCasting | undefined>;
    public scrollSavantScrolls$: Observable<Array<Scroll>>;
    public scrollSavantSpellDCLevel$: Observable<number>;

    constructor(
        private readonly _skillValuesService: CreatureSkillValueAdapter,
        private readonly _inventoryService: InventoryService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        this.scrollSavantSpellCasting$ = this._scrollSavantSpellCasting$()
            .pipe(
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.scrollSavantScrolls$ = this._scrollSavantScrolls$()
            .pipe(
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.scrollSavantSpellDCLevel$ = this._scrollSavantSpellDCLevel$()
            .pipe(
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this._keepScrollSavantOptionsUpdated();
    }

    public prepareScroll(scroll: Scroll): void {
        this.scrollSavantSpellCasting$
            .pipe(
                tap(casting => {
                    if (!casting) {
                        return;
                    }

                    const tempInv = new ItemCollection();
                    const newScroll =
                        this._inventoryService.grantInventoryItem<Scroll>(
                            scroll,
                            { creature: CreatureService.character, inventory: tempInv, amount: 1 },
                            { resetRunes: false, changeAfter: false, equipAfter: false },
                        );

                    newScroll.expiration = TimePeriods.UntilRest;
                    newScroll.price = 0;
                    newScroll.storedSpells.forEach(spell => {
                        spell.spellBookOnly = true;
                        spell.spells.length = 0;
                    });

                    casting.scrollSavant.push(Scroll.from(newScroll, RecastService.recastFns));
                }),
                take(1),
            )
            .subscribe();
    }

    public unprepareScroll(scroll: Scroll): void {
        this.scrollSavantSpellCasting$
            .pipe(
                tap(casting => {
                    if (!casting) {
                        return;
                    }

                    casting.scrollSavant =
                        casting.scrollSavant.filter(oldScroll => oldScroll !== scroll);
                }),
                take(1),
            )
            .subscribe();
    }

    private _scrollSavantSpellCasting$(): Observable<SpellCasting | undefined> {
        return CharacterFlatteningService.characterSpellCasting$$
            .pipe(
                map(spellCasting =>
                    spellCasting.find(casting =>
                        casting.castingType === SpellCastingTypes.Prepared &&
                        casting.className === 'Wizard' &&
                        casting.tradition === SpellTraditions.Arcane,
                    ),
                ),
            );
    }

    private _scrollSavantScrolls$(): Observable<Array<Scroll>> {
        return this.scrollSavantSpellCasting$
            .pipe(
                switchMap(casting =>
                    casting?.scrollSavant.values$ ?? of([]),
                ),
                map(scrolls =>
                    scrolls.sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    private _scrollSavantSpellDCLevel$(): Observable<number> {
        return CreatureService.character$$
            .pipe(
                switchMap(character =>
                    emptySafeCombineLatest(
                        this._skillsDataService.skills(character.customSkills)
                            .filter(skill => stringEqualsCaseInsensitive(skill.name, ('Arcane Spell DC'), { allowPartialString: true }))
                            .map(skill => this._skillValuesService.level$$(skill, character, character.level)),
                    ),
                ),
                map(spellDCLevels => Math.max(...spellDCLevels, 0)),
            );
    }

    /**
     * Continuously check if scroll savant scrolls have become invalid or too many,
     * usually from leveling down. Remove invalid scrolls and limit the rest to the allowed amount.
     */
    private _keepScrollSavantOptionsUpdated(): void {
        const half = .5;

        combineLatest([
            CreatureService.character$$,
            this.scrollSavantSpellCasting$,
            this._characterFeatsService.characterHasFeatAtLevel$$('Scroll Savant'),
        ])
            .pipe(
                switchMap(([character, casting, hasScrollSavant]) =>
                    (casting && hasScrollSavant)
                        ? combineLatest([
                            this.scrollSavantSpellDCLevel$,
                            character.maxSpellLevel$$,
                        ])
                            .pipe(
                                tap(([spellDCLevel, maxSpellLevel]) => {
                                    const available = spellDCLevel * half;

                                    if (
                                        casting.scrollSavant
                                            .some(scroll =>
                                                scroll.storedSpells[0] && scroll.storedSpells[0].level > maxSpellLevel,
                                            )
                                        || casting.scrollSavant.length > available
                                    ) {
                                        const scrolls =
                                            casting.scrollSavant
                                                .filter(scroll =>
                                                    scroll.storedSpells[0] && scroll.storedSpells[0].level <= maxSpellLevel,
                                                );

                                        scrolls.length = Math.min(available, scrolls.length);

                                        casting.scrollSavant = scrolls;
                                    }
                                }),
                            )
                        : of(undefined),
                ),
            )
            .subscribe();
    }
}

/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, distinctUntilChanged, shareReplay, map, switchMap, of, delay, combineLatest } from 'rxjs';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { Character } from 'src/app/classes/creatures/character/character';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { SpellLearned } from 'src/app/classes/spells/spell-learned';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spell-casting-types';
import { SpellLearningMethods } from 'src/libs/shared/definitions/spell-learning-methods';
import { SpellLevels } from 'src/libs/shared/definitions/spell-levels';
import { SpellTraditions } from 'src/libs/shared/definitions/spell-traditions';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { NgbTooltip, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { SpellComponent } from 'src/libs/shared/spell/components/spell/spell.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';

const itemsPerPage = 40;
const showAllLists = -2;

interface ComponentParameters {
    wizardCasting?: SpellCasting;
    bardCasting?: SpellCasting;
    sorcererCasting?: SpellCasting;
}

@Component({
    selector: 'app-spell-library',
    templateUrl: './spell-library.component.html',
    styleUrls: ['./spell-library.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltip,
        NgbPopover,

        FlyInMenuComponent,
        DescriptionComponent,
        ActionIconsComponent,
        SpellComponent,
        TraitComponent,
        GridIconComponent,
    ],
})
export class SpellLibraryComponent extends TrackByMixin(BaseClass) {

    @Input()
    public show = false;

    public id = 0;
    public hover = 0;
    public wordFilter = '';
    public traditionFilter: SpellTraditions | '' = '';
    public spellSource = 'spell library';
    public showLevel = 0;
    public range = 0;
    public spellTraditions = Object.values(SpellTraditions);

    public isTileMode$: Observable<boolean>;
    public isMenuOpen$: Observable<boolean>;

    private _showList = -1;
    private _showItem = '';


    constructor(
        private readonly _spellsDataService: SpellsDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _store$: Store,
    ) {
        super();

        this.isTileMode$ = propMap$(SettingsService.settings$, 'spellLibraryTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menu => menu === MenuNames.SpellLibraryMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            delay(Defaults.closingMenuClearDelay),
                        ),
                ),
            );
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public toggleTileMode(tileMode: boolean): void {
        SettingsService.settings.spellLibraryTileMode = !tileMode;
    }

    public incRange(amount: number): void {
        this.range += amount;
    }

    public shownItemRangeDesc(visibleSpells: Array<Spell>, range: number): string {
        const currentFirstItem = (range * itemsPerPage) + 1;
        const currentLastItem =
            (((range + 1) * itemsPerPage) >= visibleSpells.length)
                ? visibleSpells.length
                : ((range + 1) * itemsPerPage);

        return `Showing ${ currentFirstItem }-${ currentLastItem } of ${ visibleSpells.length } `;
    }

    public toggleShownList(level: number): void {
        this._showList = this._showList === level ? -1 : level;

        this.range = 0;
    }

    public shownList(): number {
        return this._showList;
    }

    public toggleTraditionFilter(tradition: SpellTraditions | ''): void {
        this.traditionFilter = tradition;
    }

    public shownTraditionFilter(): string {
        return this.traditionFilter;
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public isSpellShown(visibleSpells: Array<Spell>, spellIndex: number, range: number): boolean {
        return (
            visibleSpells.length < (itemsPerPage + itemsPerPage) ||
            this.shownList() === showAllLists ||
            (
                spellIndex >= (range * itemsPerPage) &&
                spellIndex < (range + 1) * itemsPerPage
            )
        );
    }

    public toggleShownItem(id = ''): void {
        this._showItem = this._showItem === id ? '' : id;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public closeFilterIfTooShort(): void {
        const minWordFilterLength = 5;

        if (this.wordFilter.length < minWordFilterLength && this._showList) {
            this._showList = -1;
        }
    }

    public setFilterForAll(): void {
        if (this.wordFilter) {
            this._showList = showAllLists;
        }
    }

    public toggleSpellLibraryMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.SpellLibraryMenu }));
    }

    public isSpellbookMinimized(): boolean {
        return SettingsService.settings.spellbookMinimized;
    }

    public componentParameters$(): Observable<ComponentParameters> {
        return combineLatest([
            this._wizardSpellCasting$(),
            this._bardSpellCastingForEsotericPolymath$(),
            this._sorcererSpellCastingForArcaneEvolution$(),
        ])
            .pipe(
                map(([wizardCasting, bardCasting, sorcererCasting]) => ({
                    wizardCasting, bardCasting, sorcererCasting,
                })),
            );
    }

    public _spellsFromSource(): Array<Spell> {
        switch (this.spellSource.toLowerCase()) {
            case 'spell library':
                return this._spellsDataService.spells();
            case 'your spellbook':
                return this._character.class?.spellBook
                    .map(learned => this._spellFromName(learned.name))
                    .filter(spell => spell);
            default: return [];
        }
    }

    public visibleSpellsOfLevel(level: number): Array<Spell> {
        return this._spellsFromSource()
            .filter((spell: Spell) =>
                (
                    (spell.levelreq === level && !spell.traits.includes('Cantrip')) ||
                    (level === 0 && spell.traits.includes('Cantrip'))
                ) &&
                (
                    !this.wordFilter || (
                        spell.name
                            .concat(spell.desc)
                            .concat(spell.desc2)
                            .concat(spell.sourceBook)
                            .concat(spell.area)
                            .concat(spell.targets)
                            .concat(spell.range)
                            .concat(spell.heightenedDescs.map(hdesc => hdesc.descs.map(desc => desc.value).join(' ')).join(' '))
                            .toLowerCase()
                            .includes(this.wordFilter.toLowerCase()) ||
                        spell.traits.filter(trait => trait.toLowerCase().includes(this.wordFilter.toLowerCase())).length
                    )
                ) && (
                    this.traditionFilter ?
                        spell.traditions.includes(this.traditionFilter) :
                        !spell.traditions.includes(SpellTraditions.Focus)
                ),
            )
            .sort((a, b) => sortAlphaNum(a.name, b.name));
    }

    public wizardSchool$(): Observable<string> {
        return this._characterFeatsService
            .characterFeatsAtLevel$()
            .pipe(
                map(feats =>
                    feats.find(taken =>
                        [
                            'Abjuration School',
                            'Conjuration School',
                            'Divination School',
                            'Enchantment School',
                            'Evocation School',
                            'Illusion School',
                            'Necromancy School',
                            'Transmutation School',
                            'Universalist Wizard',
                        ].includes(taken.name),
                    )?.name || '',
                ),
            );
    }

    //TODO: There is some duplicate code between this and _canSpellBeLearned.
    // Can the calculations be run once and the result reused?
    // Generally the spell learning could stand to be more abstracted and reusable.
    public availableForLearningDescription$(
        wizardCasting?: SpellCasting,
        bardCasting?: SpellCasting,
        sorcererCasting?: SpellCasting,
    ): Observable<string> {
        if (
            wizardCasting &&
            (!this.traditionFilter || this.traditionFilter === SpellTraditions.Arcane)
        ) {
            return this.wizardSchool$()
                .pipe(
                    map(school => {
                        let result = 'You can currently learn the following number of spells as a wizard:\n';
                        const charLevel: number = this._character.level;
                        let overdraw = 0;

                        Object.values(SpellLevels)
                            .filter((level: SpellLevels | string): level is SpellLevels => level in SpellLevels)
                            // eslint-disable-next-line complexity
                            .forEach((level: SpellLevels) => {
                                if (level === SpellLevels.Focus) {
                                    return;
                                }

                                let wizardLearned: number = this._learnedSpells('wizard', level).length;

                                wizardLearned += overdraw;
                                overdraw = 0;

                                const schoolLearned: number = this._learnedSpells('school', level).length;
                                let wizardAvailable = 0;
                                let schoolAvailable = 0;
                                let adaptedCantripAvailable = 0;
                                let adaptiveAdeptCantripAvailable = 0;
                                let adaptiveAdept1stLevelAvailable = 0;

                                if (level === SpellLevels.Cantrip) {
                                    wizardAvailable = wizardCasting.spellBookSlots[level] ?? 0;
                                    adaptedCantripAvailable = this._characterHasFeat$('Adapted Cantrip') ? 1 : 0;
                                    adaptiveAdeptCantripAvailable = this._characterHasFeat$('Adaptive Adept: Cantrip') ? 1 : 0;
                                } else {
                                    const SpellLevelToCharLevelFactor = 2;
                                    const minimumSpellbookSlot = level * SpellLevelToCharLevelFactor - 1;
                                    const maximumSpellbookSlot = Math.min(charLevel, level * SpellLevelToCharLevelFactor);

                                    for (let index = minimumSpellbookSlot; index <= maximumSpellbookSlot; index++) {
                                        wizardAvailable += wizardCasting.spellBookSlots[index] ?? 0;
                                    }
                                }

                                if (level === SpellLevels.FirstLevel && school) {
                                    if (school === 'Universalist Wizard') {
                                        wizardAvailable += 1;
                                    } else {
                                        schoolAvailable = 1;
                                    }
                                }

                                if (level === SpellLevels.FirstLevel) {
                                    adaptiveAdept1stLevelAvailable = this._characterHasFeat$('Adaptive Adept: 1st-Level Spell') ? 1 : 0;
                                }

                                if (wizardAvailable < wizardLearned) {
                                    overdraw += wizardLearned - wizardAvailable;
                                    wizardLearned = wizardAvailable;
                                }

                                if (wizardAvailable || schoolAvailable) {
                                    result +=
                                        `\n${ wizardAvailable
                                        - wizardLearned
                                        - adaptedCantripAvailable
                                        - adaptiveAdeptCantripAvailable
                                        - adaptiveAdept1stLevelAvailable
                                        } of ${ wizardAvailable
                                        - adaptedCantripAvailable
                                        - adaptiveAdeptCantripAvailable
                                        - adaptiveAdept1stLevelAvailable
                                        }${ level === SpellLevels.Cantrip
                                            ? ' Arcane Cantrips'
                                            : ` Arcane spell(s) up to level ${ level }`
                                        }`;

                                    if (schoolAvailable) {
                                        result +=
                                            `\n${ schoolAvailable
                                            - schoolLearned
                                            } of ${ schoolAvailable
                                            } Arcane spell(s) of the ${ school.toLowerCase()
                                            } up to level ${ level
                                            }`;
                                    }
                                }

                                if (adaptedCantripAvailable) {
                                    const adaptedCantripLearned: number = this._learnedSpells('adaptedcantrip').length;

                                    result += `\n${ 1 - adaptedCantripLearned } of ${ 1 } non-Arcane Cantrips via Adapted Cantrip`;
                                }

                                if (adaptiveAdeptCantripAvailable) {
                                    const adaptedcantrip = this._learnedSpells('adaptedcantrip')[0];

                                    if (adaptedcantrip) {
                                        const originalSpell = this._spellFromName(adaptedcantrip.name);

                                        if (originalSpell) {
                                            const adaptiveAdeptLearned: number = this._learnedSpells('adaptiveadept').length;

                                            result +=
                                                `\n${ 1 - adaptiveAdeptLearned } of ${ 1 } non-Arcane Cantrips of the following ` +
                                                `traditions via Adaptive Adept: ${ originalSpell.traditions.join(', ') }`;
                                        }
                                    }
                                }

                                if (adaptiveAdept1stLevelAvailable) {
                                    const adaptedcantrip = this._learnedSpells('adaptedcantrip')[0];

                                    if (adaptedcantrip) {
                                        const originalSpell = this._spellFromName(adaptedcantrip.name);

                                        if (originalSpell) {
                                            const adaptiveAdeptLearned: number = this._learnedSpells('adaptiveadept').length;

                                            result +=
                                                `\n${ 1 - adaptiveAdeptLearned
                                                } of ${ 1
                                                } non-Arcane 1st-level spell of the following traditions `
                                                + `via Adaptive Adept: ${ originalSpell.traditions.join(', ')
                                                }`;
                                        }
                                    }
                                }
                            });

                        return result || '';
                    }),
                );

        } else if (
            bardCasting &&
            this._isEsotericPolymathAllowedForTradition$(this.traditionFilter)
        ) {
            let result =
                'You can add any spell in your repertoire to your spellbook for free via esoteric polymath. '
                + 'You can learn and cast spells of the following traditions using esoteric polymath:\n';

            Object.values(SpellTraditions)
                .forEach(tradition => {
                    if (tradition !== SpellTraditions.Focus && this._isEsotericPolymathAllowedForTradition$(tradition)) {
                        result += `\n${ tradition }`;
                    }
                });

            return of(result || '');
        } else if (
            sorcererCasting &&
            (this._isArcaneEvolutionAllowedForTradition$(this.traditionFilter))
        ) {
            const result = 'You can add any spell in your repertoire to your spellbook for free via arcane evolution.';

            return of(result || '');
        } else {
            return of('');
        }
    }

    /**
     * Lists all methods available to Learn the Spell, depending on your Spellcasting and some feats. This includes:
     * - Wizard Spellcasting
     * - Wizard Spellcasting (school spell)
     * - Adapted Cantrip feat
     * - Adaptive Adept feat
     * - Esoteric Polymath feat
     * - Arcane Evolution feat
     *
     * The methods will be enabled or disabled depending on whether you fulfill the requirements other than matching Spellcasting.
     *
     * @param spell
     * @param level
     * @param wizardCasting
     * @param bardCasting
     * @param sorcererCasting
     * @returns
     */
    // eslint-disable-next-line complexity
    public availableSpellLearningOptions(
        spell: Spell,
        level: number,
        wizardCasting?: SpellCasting,
        bardCasting?: SpellCasting,
        sorcererCasting?: SpellCasting,
    ): Array<{ key: string; title: string; disabled: boolean }> {
        const options: Array<{ key: string; title: string; disabled: boolean }> = [];

        // No options should be available if the spell is already learned.
        // Spell learning is not available for focus spells.
        if (
            this._learnedSpells().some(learnedSpell => learnedSpell.name === spell.name)
            || this.traditionFilter === SpellTraditions.Focus
        ) {
            return [];
        }

        if (wizardCasting) {
            // Wizard Spellcasting allows learning a number of Arcane spells and spells from your spell list for free.
            // Wizard Spellcasting also allows learning an additional number of spells of your school for free.
            if (
                spell.traditions.includes(SpellTraditions.Arcane) ||
                !!this._character.class.getSpellsFromSpellList(spell.name).length
            ) {
                const wizardKey = SpellLearningMethods.Wizard;
                const schoolKey = SpellLearningMethods.School;

                options.push(
                    {
                        key: wizardKey,
                        title: 'Learn as Wizard',
                        disabled: !this._canSpellBeLearned$(wizardCasting, level, spell, wizardKey),
                    },
                    {
                        key: schoolKey,
                        title: 'Learn via School',
                        disabled: !this._canSpellBeLearned$(wizardCasting, level, spell, schoolKey),
                    },
                );
            }

            // The Adapted Cantrip feat allows learning a cantrip from any tradition other than Arcane for free.
            // The Adaptive Adept feat allows learning either a second cantrip or a 1st-level spell from the same tradition for free.
            if (
                !spell.traditions.includes(SpellTraditions.Arcane)
            ) {
                if (
                    this._characterHasFeat$('Adapted Cantrip') &&
                    spell.traits.includes('Cantrip')
                ) {
                    const key = SpellLearningMethods.AdaptedCantrip;

                    options.push({
                        key,
                        title: 'Learn via Adapted Cantrip',
                        disabled: !this._canSpellBeLearned$(wizardCasting, level, spell, key),
                    });
                }

                if (
                    (
                        this._characterHasFeat$('Adaptive Adept: Cantrip') &&
                        spell.traits.includes('Cantrip')
                    ) ||
                    (
                        this._characterHasFeat$('Adaptive Adept: 1st-Level Spell') &&
                        spell.levelreq === 1
                    )
                ) {
                    const key = SpellLearningMethods.AdaptiveAdept;

                    options.push({
                        key,
                        title: 'Learn via Adaptive Adept',
                        disabled: !this._canSpellBeLearned$(wizardCasting, level, spell, key),
                    });
                }
            }
        }

        // The Esoteric Polymath spell allows learning Occult spells and spells from your spell list for free
        // with your Bard Spellcasting, provided they are in your Spell Repertoire.
        if (
            bardCasting &&
            (
                spell.traditions.includes(SpellTraditions.Occult) ||
                !!this._character.class.getSpellsFromSpellList(spell.name).length
            )
        ) {
            const key = SpellLearningMethods.EsotericPolymath;

            options.push({
                key,
                title: 'Learn via Esoteric Polymath',
                disabled: !this._canSpellBeLearned$(bardCasting, level, spell, key),
            });
        }

        // The Arcane Evolution spell allows learning Arcane spells and spells from your spell list for free
        // with your Arcane Sorcerer Spellcasting, provided they are in your Spell Repertoire.
        if (
            sorcererCasting &&
            (
                spell.traditions.includes(SpellTraditions.Arcane) ||
                !!this._character.class?.getSpellsFromSpellList(spell.name).length
            )
        ) {
            const key = SpellLearningMethods.ArcaneEvolution;

            options.push({
                key,
                title: 'Learn via Arcane Evolution',
                disabled: !this._canSpellBeLearned$(sorcererCasting, level, spell, key),
            });
        }

        const learnAsSpellKey = SpellLearningMethods.LearnASpell;

        // You can always Learn A Spell by paying money.
        options.push({
            key: learnAsSpellKey,
            title: 'Learn using Learn A Spell activity',
            disabled: false,
        });

        return options;
    }

    public isSpellLearned(name: string): SpellLearned | null {
        return this._character.class?.learnedSpells(name)[0] ?? null;
    }

    public learnSpell(spell: Spell, source: string): void {
        this._character.class.learnSpell(spell, source);

        if (SettingsService.settings.autoCloseChoices) { this.toggleShownItem(); }
    }

    public unlearnSpell(spell: Spell): void {
        this._character.class.unlearnSpell(spell);
    }

    public learnedSpellSource$(source: string): Observable<string> {
        switch (source) {
            case SpellLearningMethods.Wizard:
                return of('(learned as Wizard)');
            case SpellLearningMethods.EsotericPolymath:
                return of('(learned via Esoteric Polymath)');
            case SpellLearningMethods.ArcaneEvolution:
                return of('(learned via Arcane Evolution)');
            case SpellLearningMethods.AdaptedCantrip:
                return of('(learned via Adapted Cantrip)');
            case SpellLearningMethods.AdaptiveAdept:
                return of('(learned via Adaptive Adept)');
            case SpellLearningMethods.School:
                return this.wizardSchool$()
                    .pipe(
                        map(school => `(learned via ${ school?.toLowerCase() || 'school' })`),
                    );
            case SpellLearningMethods.LearnASpell:
                return of('(learned via Learn A Spell activity)');
            default:
                return of('');
        }
    }

    public spellMasteryAvailableDescription(wizardCasting?: SpellCasting): string {
        if (
            wizardCasting &&
            this.traditionFilter !== SpellTraditions.Focus
        ) {
            if (this._characterHasFeat$('Spell Mastery')) {
                const available = 4;
                const selected: Array<SpellChoice> = this.availableSpellChoicesForSpellMastery(wizardCasting);

                let result =
                    `You can select ${ available
                    - selected.length
                    } of ${ available
                    } spells of different levels up to 9th level to automatically prepare via Spell Mastery.`;

                if (selected.length) {
                    result += ' You have already selected the following spells:\n';
                }

                const twoDigits = 2;

                selected
                    .sort((a, b) => sortAlphaNum(a.level.toString().padStart(twoDigits, '0'), b.level.toString().padStart(twoDigits, '0')))
                    .forEach(choice => {
                        result += `\n${ choice.spells[0]?.name } (level ${ choice.level })`;
                    });

                return result;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    public canSpellBeSelectedForSpellMastery(wizardSpellCasting: SpellCasting, spell: Spell): boolean {
        return (
            spell.levelreq > 0 &&
            !spell.traits.includes('Cantrip') &&
            wizardSpellCasting.className === 'Wizard' &&
            this.traditionFilter !== SpellTraditions.Focus &&
            spell.traditions.includes(SpellTraditions.Arcane) &&
            this._characterHasFeat$('Spell Mastery') &&
            !this.isSpellSelectedForSpellMastery(wizardSpellCasting, spell)
        );
    }

    public isSpellSelectedForSpellMastery(wizardSpellCasting: SpellCasting | undefined, spell: Spell): boolean {
        return wizardSpellCasting?.spellChoices
            .some(choice =>
                choice.source === 'Feat: Spell Mastery' &&
                choice.spells.some(spellTaken => spellTaken.name === spell.name),
            ) || false;
    }

    public availableSpellChoicesForSpellMastery(wizardSpellCasting?: SpellCasting): Array<SpellChoice> {
        return wizardSpellCasting?.spellChoices
            .filter(choice =>
                choice.source === 'Feat: Spell Mastery' &&
                choice.spells.length,
            ) || [];
    }

    public isSpellMasteryAllowedForSpell(casting: SpellCasting, levelNumber: number, spell: Spell): boolean {
        //Allow taking this spell if this spell or a spell of this level is not taken yet, and if no more than 3 of 4 spells are taken.
        const maxSpellMasterySpells = 4;

        return !casting.spellChoices.find(choice =>
            choice.source === 'Feat: Spell Mastery' &&
            (
                choice.level === levelNumber ||
                choice.spells.find(spellTaken => spellTaken.name === spell.name)
            ),
        ) &&
            casting.spellChoices.filter(choice => choice.source === 'Feat: Spell Mastery').length < maxSpellMasterySpells;
    }

    public addSpellToSpellMastery(spell: Spell): void {
        const newChoice: SpellChoice = new SpellChoice();
        const newSpellTaken: SpellGain = new SpellGain();

        newChoice.className = 'Wizard';
        newChoice.castingType = SpellCastingTypes.Prepared;
        newChoice.source = 'Feat: Spell Mastery';
        newChoice.level = spell.levelreq;
        newSpellTaken.name = spell.name;
        newSpellTaken.locked = true;
        newSpellTaken.source = 'Feat: Spell Mastery';
        newChoice.spells.push(newSpellTaken);
        this._character.class.addSpellChoice(spell.levelreq, newChoice);
    }

    public removeSpellFromSpellMastery(casting: SpellCasting, spell: Spell): void {
        const oldChoice: SpellChoice | undefined =
            casting.spellChoices.find(choice =>
                choice.source === 'Feat: Spell Mastery' &&
                choice.spells.find(spellTaken => spellTaken.name === spell.name),
            );

        if (oldChoice) {
            this._character.class.removeSpellChoice(oldChoice);
        }
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    // eslint-disable-next-line complexity
    private _canSpellBeLearned$(casting: SpellCasting, level: number, spell: Spell, source: string): Observable<boolean> {
        //These checks all assume that the correct spellcasting has been passed.

        if (source === 'wizard') {
            return combineLatest([
                CharacterFlatteningService.characterLevel$,
                this._characterHasFeat$('Adapted Cantrip'),
                this._characterHasFeat$('Adaptive Adept: Cantrip'),
                this._characterHasFeat$('Adaptive Adept: 1st-Level Spell'),
                this.wizardSchool$(),
            ])
                .pipe(
                    map(([characterLevel, hasAdaptedCantrip, hasAdaptiveAdeptCantrip, hasAdaptiveAdeptSpell, wizardSchool]) => {
                        const wizardLearnedAtLevel: number =
                            this._learnedSpells('wizard').filter(learned => learned.level === level).length;
                        const wizardLearnedAll: number =
                            this._learnedSpells('wizard').filter(learned => (level > 0) === (learned.level > 0)).length;
                        let wizardAvailableFromLevel = 0;
                        let wizardAvailableAll = 0;
                        const adaptedCantripAvailable = hasAdaptedCantrip ? 1 : 0;
                        const adaptiveAdeptCantripAvailable = hasAdaptiveAdeptCantrip ? 1 : 0;
                        const adaptiveAdept1stLevelAvailable = hasAdaptiveAdeptSpell ? 1 : 0;

                        if (level === 0) {
                            wizardAvailableFromLevel =
                                (casting.spellBookSlots[level] ?? 0) - adaptedCantripAvailable - adaptiveAdeptCantripAvailable;
                            wizardAvailableAll =
                                (casting.spellBookSlots[level] ?? 0) - adaptedCantripAvailable - adaptiveAdeptCantripAvailable;
                        } else {
                            const SpellLevelToCharLevelFactor = 2;
                            const minimumSpellbookSlot = level * SpellLevelToCharLevelFactor - 1;

                            for (let index = minimumSpellbookSlot; index <= characterLevel; index++) {
                                wizardAvailableFromLevel += casting.spellBookSlots[index] ?? 0;
                            }

                            for (let index = 1; index <= characterLevel; index++) {
                                wizardAvailableAll += casting.spellBookSlots[index] ?? 0;
                            }
                        }

                        if (level === 1 && wizardSchool === 'Universalist Wizard') {
                            wizardAvailableFromLevel += 1;
                            wizardAvailableAll += 1;
                        }

                        if (level === 1) {
                            wizardAvailableFromLevel -= adaptiveAdept1stLevelAvailable;
                            wizardAvailableAll -= adaptiveAdept1stLevelAvailable;
                        }

                        return wizardAvailableFromLevel > wizardLearnedAtLevel && wizardAvailableAll > wizardLearnedAll;
                    }),
                );
        }

        if (source === 'school') {
            return this.wizardSchool$()
                .pipe(
                    map(wizardSchool => {
                        let schoolAvailable = 0;
                        const schoolLearned: number = this._learnedSpells('school', level).length;

                        if (level === 1 && wizardSchool) {
                            const schoolName = wizardSchool.split(' ')[0];

                            if (wizardSchool !== 'Universalist Wizard' && schoolName && spell.traits.includes(schoolName)) {
                                schoolAvailable += 1;
                            }
                        }

                        return schoolAvailable > schoolLearned;
                    }),
                );
        }

        //To-Do: Either forbid learning cantrips via esoteric polymath,
        // or allow adding cantrips learned via esoteric polymath to your repertoire.
        if (source === 'esotericpolymath') {
            return emptySafeCombineLatest(
                spell.traditions.map(tradition => this._isEsotericPolymathAllowedForTradition$(tradition)),
            )
                .pipe(
                    map(traditionsAllowed => {
                        if (traditionsAllowed.includes(true)) {
                            // You can learn a spell via esoteric polymath if it is in your spell repertoire,
                            // i.e. if you have chosen it for any spell slot.
                            return casting.spellChoices.some(choice => choice.spells.some(taken => taken.name === spell.name));
                        }

                        return false;
                    }),
                );
        }

        //To-Do: Either forbid learning cantrips via arcane evolution,
        // or allow adding cantrips learned via arcane evolution to your repertoire.
        if (source === 'arcaneevolution') {
            return emptySafeCombineLatest(
                spell.traditions.map(tradition => this._isArcaneEvolutionAllowedForTradition$(tradition)),
            )
                .pipe(
                    map(traditionsAllowed => {
                        if (traditionsAllowed.includes(true)) {
                            // You can learn a spell via arcane evolution if it is in your spell repertoire,
                            // i.e. if you have chosen it for any spell slot.
                            return casting.spellChoices.some(choice => choice.spells.some(taken => taken.name === spell.name));
                        }

                        return false;
                    }),
                );
        }

        if (source === 'adaptedcantrip') {
            // You can learn a spell via adapted cantrip if none of its traditions is your own.
            // This has been checked already at this point.
            return of(true);
        }

        if (source === 'adaptiveadept') {
            // You can learn a spell via adaptive adept if none of its traditions is your own (this has already been checked at this point),
            // and it matches a tradition of the cantrip learned via Adapted Cantrip.
            const adaptedcantrip = this._learnedSpells('adaptedcantrip')[0];

            if (adaptedcantrip) {
                const originalSpell = this._spellFromName(adaptedcantrip.name);

                return of(originalSpell && spell.traditions.some(tradition => originalSpell.traditions.includes(tradition)));
            }
        }

        return of(false);
    }

    private _learnedSpells(source: string = '', level: SpellLevels = -1): Array<SpellLearned> {
        return this._character.class?.learnedSpells('', source, level) || [];
    }

    private _characterHasFeat$(name: string): Observable<boolean> {
        return this._characterFeatsService.characterHasFeatAtLevel$(name);
    }

    private _isEsotericPolymathAllowedForTradition$(tradition: SpellTraditions | ''): Observable<boolean> {
        return this._characterHasFeat$('Esoteric Polymath')
            .pipe(
                switchMap(hasEsotericPolymath => {
                    if (hasEsotericPolymath) {
                        if (['', SpellTraditions.Occult].includes(tradition)) {
                            return of(true);
                        } else {
                            return this._characterHasFeat$('Impossible Polymath')
                                .pipe(
                                    switchMap(hasImpossiblePolymath => {
                                        if (hasImpossiblePolymath) {
                                            const character = this._character;
                                            let skill = '';

                                            switch (tradition) {
                                                case SpellTraditions.Arcane:
                                                    skill = 'Arcana';
                                                    break;
                                                case SpellTraditions.Divine:
                                                    skill = 'Religion';
                                                    break;
                                                case SpellTraditions.Primal:
                                                    skill = 'Nature';
                                                    break;
                                                default:
                                                    return of(false);
                                            }

                                            return this._skillValuesService.level$(skill, character, character.level)
                                                .pipe(
                                                    map(skillLevel =>
                                                        skillLevel >= SkillLevels.Trained,
                                                    ),
                                                );
                                        }

                                        return of(false);
                                    }),
                                );

                        }
                    }

                    return of(false);
                }),
            );
    }

    private _isArcaneEvolutionAllowedForTradition$(tradition: SpellTraditions | ''): Observable<boolean> {
        return this._characterHasFeat$('Arcane Evolution')
            .pipe(
                map(hasArcaneEvolution =>
                    hasArcaneEvolution
                    && tradition === SpellTraditions.Arcane,
                ),
            );
    }

    private _wizardSpellCasting$(): Observable<SpellCasting | undefined> {
        return combineLatest([
            CharacterFlatteningService.characterLevel$,
            CharacterFlatteningService.characterSpellCasting$,
        ])
            .pipe(
                map(([characterLevel, spellCastings]) => {
                    const wizardCasting: SpellCasting | undefined =
                        spellCastings.find(casting =>
                            casting.className === 'Wizard' &&
                            casting.castingType === SpellCastingTypes.Prepared &&
                            casting.charLevelAvailable <= characterLevel,
                        );

                    return wizardCasting || undefined;
                }),
            );
    }

    private _bardSpellCastingForEsotericPolymath$(): Observable<SpellCasting | undefined> {
        return combineLatest([
            this._characterHasFeat$('Esoteric Polymath'),
            CharacterFlatteningService.characterLevel$,
            CharacterFlatteningService.characterSpellCasting$,
        ])
            .pipe(
                map(([hasEsotericPolymath, characterLevel, spellCastings]) => {
                    if (hasEsotericPolymath) {
                        const bardCasting: SpellCasting | undefined =
                            spellCastings.find(casting =>
                                casting.className === 'Bard' &&
                                casting.castingType === SpellCastingTypes.Spontaneous &&
                                casting.charLevelAvailable <= characterLevel,
                            );

                        return bardCasting || undefined;
                    } else {
                        return undefined;
                    }
                }),
            );
    }

    private _sorcererSpellCastingForArcaneEvolution$(): Observable<SpellCasting | undefined> {
        return combineLatest([
            this._characterHasFeat$('Arcane Evolution'),
            CharacterFlatteningService.characterLevel$,
            CharacterFlatteningService.characterSpellCasting$,
        ])
            .pipe(
                map(([hasArcaneEvolution, characterLevel, spellCastings]) => {
                    if (hasArcaneEvolution) {
                        const sorcererCasting: SpellCasting | undefined =
                            spellCastings.find(casting =>
                                casting.className === 'Sorcerer' &&
                                casting.castingType === SpellCastingTypes.Spontaneous &&
                                casting.charLevelAvailable <= characterLevel,
                            );

                        return sorcererCasting || undefined;
                    } else {
                        return undefined;
                    }
                }),
            );
    }

}

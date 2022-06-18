import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { SpellsService } from 'src/app/services/spells.service';
import { CharacterService } from 'src/app/services/character.service';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellGain } from 'src/app/classes/SpellGain';
import { TraitsService } from 'src/app/services/traits.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Trait } from 'src/app/classes/Trait';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellLevels } from 'src/libs/shared/definitions/spellLevels';
import { SpellLearned } from 'src/app/classes/SpellLearned';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SpellLearningMethods } from 'src/libs/shared/definitions/spellLearningMethods';

const itemsPerPage = 40;
const showAllLists = -2;

interface ComponentParameters {
    wizardCasting: SpellCasting | null;
    bardCasting: SpellCasting | null;
    sorcererCasting: SpellCasting | null;
}

@Component({
    selector: 'app-spellLibrary',
    templateUrl: './spellLibrary.component.html',
    styleUrls: ['./spellLibrary.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellLibraryComponent implements OnInit, OnDestroy {

    public id = 0;
    public hover = 0;
    public wordFilter = '';
    public traditionFilter: SpellTraditions | '' = '';
    public spellSource = 'spell library';
    public showLevel = 0;
    public range = 0;
    public spellTraditions = Object.values(SpellTraditions);

    private _showList = -1;
    private _showItem = '';

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _spellsService: SpellsService,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _traitsService: TraitsService,
        public trackers: Trackers,
    ) { }

    public get spellLibraryMenuState(): MenuState {
        return this._characterService.spellLibraryMenuState();
    }

    public get isTileMode(): boolean {
        return this._character.settings.spellLibraryTileMode;
    }

    public get stillLoading(): boolean {
        return this._spellsService.stillLoading || this._characterService.stillLoading;
    }

    private get _character(): Character {
        return this._characterService.character;
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
        return this._traitsService.traitFromName(name);
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
        this._characterService.toggleMenu(MenuNames.SpellLibraryMenu);
    }

    public toggleTileMode(): void {
        this._character.settings.spellLibraryTileMode = !this._character.settings.spellLibraryTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spelllibrary');
        this._refreshService.processPreparedChanges();
    }

    public isSpellbookMinimized(): boolean {
        return this._characterService.character.settings.spellbookMinimized;
    }

    public componentParameters(): ComponentParameters {
        return {
            wizardCasting: this._wizardSpellCasting(),
            bardCasting: this._bardSpellCastingForEsotericPolymath(),
            sorcererCasting: this._sorcererSpellCastingForArcaneEvolution(),
        };
    }

    public _spellsFromSource(): Array<Spell> {
        switch (this.spellSource.toLowerCase()) {
            case 'spell library':
                return this._spells();
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
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public wizardSchool(): string {
        return this._characterService
            .characterFeatsTaken(1, this._character.level)
            .find(taken =>
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
            )?.name || '';
    }

    public availableForLearningDescription(wizardCasting: SpellCasting, bardCasting: SpellCasting, sorcererCasting: SpellCasting): string {
        if (
            wizardCasting &&
            (!this.traditionFilter || this.traditionFilter === SpellTraditions.Arcane)
        ) {
            let result = 'You can currently learn the following number of spells as a wizard:\n';
            const school = this.wizardSchool();
            const charLevel: number = this._character.level;
            let overdraw = 0;

            // eslint-disable-next-line complexity
            Object.values(SpellLevels).forEach((level: number) => {
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
                    wizardAvailable = wizardCasting.spellBookSlots[level];
                    adaptedCantripAvailable = this._characterHasFeat('Adapted Cantrip') ? 1 : 0;
                    adaptiveAdeptCantripAvailable = this._characterHasFeat('Adaptive Adept: Cantrip') ? 1 : 0;
                } else {
                    const SpellLevelToCharLevelFactor = 2;
                    const minimumSpellbookSlot = level * SpellLevelToCharLevelFactor - 1;
                    const maximumSpellbookSlot = Math.min(charLevel, level * SpellLevelToCharLevelFactor);

                    for (let index = minimumSpellbookSlot; index <= maximumSpellbookSlot; index++) {
                        wizardAvailable += wizardCasting.spellBookSlots[index];
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
                    adaptiveAdept1stLevelAvailable = this._characterHasFeat('Adaptive Adept: 1st-Level Spell') ? 1 : 0;
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
                        const originalSpell = this._spells(adaptedcantrip.name)[0];

                        if (originalSpell) {
                            const adaptiveAdeptLearned: number = this._learnedSpells('adaptiveadept').length;

                            result +=
                                `\n${ 1 - adaptiveAdeptLearned
                                } of ${ 1
                                } non-Arcane Cantrips of the following traditions via Adaptive Adept: ${ originalSpell.traditions.join(', ')
                                }`;
                        }
                    }
                }

                if (adaptiveAdept1stLevelAvailable) {
                    const adaptedcantrip = this._learnedSpells('adaptedcantrip')[0];

                    if (adaptedcantrip) {
                        const originalSpell = this._spells(adaptedcantrip.name)[0];

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
        } else if (
            bardCasting &&
            this._isEsotericPolymathAllowedForTradition(this.traditionFilter)
        ) {
            let result =
                'You can add any spell in your repertoire to your spellbook for free via esoteric polymath. '
                + 'You can learn and cast spells of the following traditions using esoteric polymath:\n';

            Object.values(SpellTraditions)
                .forEach(tradition => {
                    if (tradition !== SpellTraditions.Focus && this._isEsotericPolymathAllowedForTradition(tradition)) {
                        result += `\n${ tradition }`;
                    }
                });

            return result || '';
        } else if (
            sorcererCasting &&
            (this._isArcaneEvolutionAllowedForTradition(this.traditionFilter))
        ) {
            const result = 'You can add any spell in your repertoire to your spellbook for free via arcane evolution.';

            return result || '';
        } else {
            return '';
        }
    }

    // eslint-disable-next-line complexity
    public availableSpellLearningOptions(
        spell: Spell,
        level: number,
        wizardCasting: SpellCasting,
        bardCasting: SpellCasting,
        sorcererCasting: SpellCasting,
    ): Array<{ key: string; title: string; disabled: boolean }> {
        const options: Array<{ key: string; title: string; disabled: boolean }> = [];

        if (this._learnedSpells(spell.name).length || this.traditionFilter === SpellTraditions.Focus) {
            return [];
        }

        if (wizardCasting) {
            if (
                spell.traditions.includes(SpellTraditions.Arcane) ||
                this._character.getSpellsFromSpellList(spell.name).length
            ) {
                const wizardKey = SpellLearningMethods.Wizard;
                const schoolKey = SpellLearningMethods.School;

                options.push(
                    {
                        key: wizardKey,
                        title: 'Learn as Wizard',
                        disabled: !this._canSpellBeLearned(wizardCasting, level, spell, wizardKey),
                    },
                    {
                        key: schoolKey,
                        title: 'Learn via School',
                        disabled: !this._canSpellBeLearned(wizardCasting, level, spell, schoolKey),
                    },
                );
            }

            if (
                !spell.traditions.includes(SpellTraditions.Arcane)
            ) {
                if (
                    this._characterHasFeat('Adapted Cantrip') &&
                    spell.traits.includes('Cantrip')
                ) {
                    const key = SpellLearningMethods.AdaptedCantrip;

                    options.push({
                        key,
                        title: 'Learn via Adapted Cantrip',
                        disabled: !this._canSpellBeLearned(wizardCasting, level, spell, key),
                    });
                }

                if (
                    (
                        this._characterHasFeat('Adaptive Adept: Cantrip') &&
                        spell.traits.includes('Cantrip')
                    ) ||
                    (
                        this._characterHasFeat('Adaptive Adept: 1st-Level Spell') &&
                        spell.levelreq === 1
                    )
                ) {
                    const key = SpellLearningMethods.AdaptiveAdept;

                    options.push({
                        key,
                        title: 'Learn via Adaptive Adept',
                        disabled: !this._canSpellBeLearned(wizardCasting, level, spell, key),
                    });
                }
            }
        }

        if (
            bardCasting &&
            (
                !spell.traditions.includes(SpellTraditions.Occult) ||
                this._character.getSpellsFromSpellList(spell.name).length
            )
        ) {
            const key = SpellLearningMethods.EsotericPolymath;

            options.push({
                key,
                title: 'Learn via Esoteric Polymath',
                disabled: !this._canSpellBeLearned(bardCasting, level, spell, key),
            });
        }

        if (
            sorcererCasting &&
            (
                !spell.traditions.includes(SpellTraditions.Arcane) ||
                this._character.getSpellsFromSpellList(spell.name).length
            )
        ) {
            const key = SpellLearningMethods.ArcaneEvolution;

            options.push({
                key,
                title: 'Learn via Arcane Evolution',
                disabled: !this._canSpellBeLearned(sorcererCasting, level, spell, key),
            });
        }


        const learnAsSpellKey = SpellLearningMethods.LearnASpell;

        options.push({
            key: learnAsSpellKey,
            title: 'Learn using Learn A Spell activity',
            disabled: !this._canSpellBeLearned(sorcererCasting, level, spell, learnAsSpellKey),
        });

        return options;
    }

    public isSpellLearned(name: string): SpellLearned {
        return this._character.learnedSpells(name)[0] || null;
    }

    public learnSpell(spell: Spell, source: string): void {
        this._character.learnSpell(spell, source);

        if (this._character.settings.autoCloseChoices) { this.toggleShownItem(); }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.processPreparedChanges();
    }

    public unlearnSpell(spell: Spell): void {
        this._character.unlearnSpell(spell);
    }

    public learnedSpellSource(source: string): string {
        switch (source) {
            case SpellLearningMethods.Wizard:
                return '(learned as Wizard)';
            case SpellLearningMethods.EsotericPolymath:
                return '(learned via Esoteric Polymath)';
            case SpellLearningMethods.ArcaneEvolution:
                return '(learned via Arcane Evolution)';
            case SpellLearningMethods.AdaptedCantrip:
                return '(learned via Adapted Cantrip)';
            case SpellLearningMethods.AdaptiveAdept:
                return '(learned via Adaptive Adept)';
            case SpellLearningMethods.School:
                return `(learned via ${ this.wizardSchool()?.toLowerCase() || 'school' })`;
            case SpellLearningMethods.LearnASpell:
                return '(learned via Learn A Spell activity)';
            default:
                return '';
        }
    }

    public spellMasteryAvailableDescription(wizardCasting: SpellCasting): string {
        if (
            wizardCasting &&
            this.traditionFilter !== SpellTraditions.Focus
        ) {
            if (this._characterHasFeat('Spell Mastery')) {
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
                    .sort((a, b) => SortAlphaNum(a.level.toString().padStart(twoDigits, '0'), b.level.toString().padStart(twoDigits, '0')))
                    .forEach(choice => {
                        result += `\n${ choice.spells[0].name } (level ${ choice.level })`;
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
            this._characterHasFeat('Spell Mastery') &&
            !this.isSpellSelectedForSpellMastery(wizardSpellCasting, spell)
        );
    }

    public isSpellSelectedForSpellMastery(wizardSpellCasting: SpellCasting, spell: Spell): boolean {
        return wizardSpellCasting.spellChoices
            .some(choice =>
                choice.source === 'Feat: Spell Mastery' &&
                choice.spells.find(spellTaken => spellTaken.name === spell.name),
            );
    }

    public availableSpellChoicesForSpellMastery(wizardSpellCasting: SpellCasting): Array<SpellChoice> {
        return wizardSpellCasting.spellChoices
            .filter(choice =>
                choice.source === 'Feat: Spell Mastery' &&
                choice.spells.length,
            );
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
        this._character.addSpellChoice(this._characterService, spell.levelreq, newChoice);
        this._refreshService.processPreparedChanges();
    }

    public removeSpellFromSpellMastery(casting: SpellCasting, spell: Spell): void {
        const oldChoice: SpellChoice =
            casting.spellChoices.find(choice =>
                choice.source === 'Feat: Spell Mastery' &&
                choice.spells.find(spellTaken => spellTaken.name === spell.name),
            );

        if (oldChoice) {
            this._character.removeSpellChoice(this._characterService, oldChoice);
        }

        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['spelllibrary', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['spelllibrary', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _spellFromName(name: string): Spell {
        return this._spellsService.spellFromName(name);
    }

    private _spells(name = ''): Array<Spell> {
        return this._spellsService.spells(name);
    }

    // eslint-disable-next-line complexity
    private _canSpellBeLearned(casting: SpellCasting, level: number, spell: Spell, source: string): boolean {
        const character = this._character;

        //These checks all assume that the correct spellcasting has been passed.

        if (source === 'wizard') {
            const charLevel: number = character.level;
            const wizardLearnedAtLevel: number =
                this._learnedSpells('wizard').filter(learned => learned.level === level).length;
            const wizardLearnedAll: number =
                this._learnedSpells('wizard').filter(learned => (level > 0) === (learned.level > 0)).length;
            let wizardAvailableFromLevel = 0;
            let wizardAvailableAll = 0;
            const adaptedCantripAvailable = this._characterHasFeat('Adapted Cantrip') ? 1 : 0;
            const adaptiveAdeptCantripAvailable = this._characterHasFeat('Adaptive Adept: Cantrip') ? 1 : 0;
            const adaptiveAdept1stLevelAvailable = this._characterHasFeat('Adaptive Adept: 1st-Level Spell') ? 1 : 0;

            if (level === 0) {
                wizardAvailableFromLevel = casting.spellBookSlots[level] - adaptedCantripAvailable - adaptiveAdeptCantripAvailable;
                wizardAvailableAll = casting.spellBookSlots[level] - adaptedCantripAvailable - adaptiveAdeptCantripAvailable;
            } else {
                const SpellLevelToCharLevelFactor = 2;
                const minimumSpellbookSlot = level * SpellLevelToCharLevelFactor - 1;

                for (let index = minimumSpellbookSlot; index <= charLevel; index++) {
                    wizardAvailableFromLevel += casting.spellBookSlots[index];
                }

                for (let index = 1; index <= charLevel; index++) {
                    wizardAvailableAll += casting.spellBookSlots[index];
                }
            }

            if (level === 1 && this.wizardSchool() === 'Universalist Wizard') {
                wizardAvailableFromLevel += 1;
                wizardAvailableAll += 1;
            }

            if (level === 1) {
                wizardAvailableFromLevel -= adaptiveAdept1stLevelAvailable;
                wizardAvailableAll -= adaptiveAdept1stLevelAvailable;
            }

            return wizardAvailableFromLevel > wizardLearnedAtLevel && wizardAvailableAll > wizardLearnedAll;
        }

        if (source === 'school') {
            const school = this.wizardSchool();
            let schoolAvailable = 0;
            const schoolLearned: number = this._learnedSpells('school', level).length;

            if (level === 1 && school) {
                if (school !== 'Universalist Wizard' && spell.traits.includes(school.split(' ')[0])) {
                    schoolAvailable += 1;
                }
            }

            return schoolAvailable > schoolLearned;
        }

        if (source === 'esotericpolymath') {
            if (spell.traditions.find(tradition => this._isEsotericPolymathAllowedForTradition(tradition))) {
                // You can learn a spell via esoteric polymath if it is in your spell repertoire,
                // i.e. if you have chosen it for any spell slot.
                return casting.spellChoices.some(choice => choice.spells.some(taken => taken.name === spell.name));
            }
        }

        if (source === 'arcaneevolution') {
            if (spell.traditions.find(tradition => this._isArcaneEvolutionAllowedForTradition(tradition))) {
                // You can learn a spell via arcane evolution if it is in your spell repertoire,
                // i.e. if you have chosen it for any spell slot.
                return casting.spellChoices.some(choice => choice.spells.some(taken => taken.name === spell.name));
            }
        }

        if (source === 'adaptedcantrip') {
            // You can learn a spell via adapted cantrip if none of its traditions is your own.
            // This has been checked already at this point.
            return true;
        }

        if (source === 'adaptiveadept') {
            // You can learn a spell via adaptive adept if none of its traditions is your own,
            // and it matches a tradition of the cantrip learned via adapted adept.
            // With Adaptive Adept, you can choose spells of the same tradition(s) as with Adapted Cantrip, but not your own.
            const adaptedcantrip = this._learnedSpells('adaptedcantrip')[0];

            if (adaptedcantrip) {
                const originalSpell = this._spells(adaptedcantrip.name)[0];

                return originalSpell && spell.traditions.some(tradition => originalSpell.traditions.includes(tradition));
            }
        }
    }

    private _learnedSpells(source = '', level = -1): Array<SpellLearned> {
        return this._character.learnedSpells('', source, level);
    }

    private _characterHasFeat(name: string): boolean {
        return this._characterService.characterHasFeat(name);
    }

    private _isEsotericPolymathAllowedForTradition(tradition: SpellTraditions | ''): boolean {
        if (this._characterHasFeat('Esoteric Polymath')) {
            if (['', SpellTraditions.Occult].includes(tradition)) {
                return true;
            } else if (this._characterHasFeat('Impossible Polymath')) {
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
                        return false;
                }

                return this._characterService
                    .skills(character, skill)[0]
                    .level(character, this._characterService, character.level)
                    >= SkillLevels.Trained;
            }
        }

        return false;
    }

    private _isArcaneEvolutionAllowedForTradition(tradition: SpellTraditions | ''): boolean {
        return this._characterHasFeat('Arcane Evolution') && tradition === SpellTraditions.Arcane;
    }

    private _wizardSpellCasting(): SpellCasting {
        const wizardCasting: SpellCasting =
            this._character.class?.spellCasting.find(casting =>
                casting.className === 'Wizard' &&
                casting.castingType === SpellCastingTypes.Prepared &&
                casting.charLevelAvailable <= this._character.level,
            );

        return wizardCasting || null;
    }

    private _bardSpellCastingForEsotericPolymath(): SpellCasting {
        if (this._characterHasFeat('Esoteric Polymath')) {
            const character = this._character;
            const bardCasting: SpellCasting =
                character.class?.spellCasting.find(casting =>
                    casting.className === 'Bard' &&
                    casting.castingType === SpellCastingTypes.Spontaneous &&
                    casting.charLevelAvailable <= character.level,
                );

            return bardCasting || null;
        } else {
            return null;
        }
    }

    private _sorcererSpellCastingForArcaneEvolution(): SpellCasting {
        if (this._characterHasFeat('Arcane Evolution')) {
            const character = this._character;
            const sorcererCasting: SpellCasting =
                character.class?.spellCasting.find(casting =>
                    casting.className === 'Sorcerer' &&
                    casting.castingType === SpellCastingTypes.Spontaneous &&
                    casting.charLevelAvailable <= character.level,
                );

            return sorcererCasting || null;
        } else {
            return null;
        }
    }

}

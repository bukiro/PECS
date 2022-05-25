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

@Component({
    selector: 'app-spellLibrary',
    templateUrl: './spellLibrary.component.html',
    styleUrls: ['./spellLibrary.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellLibraryComponent implements OnInit, OnDestroy {

    private showList = -1;
    private showItem = '';
    public id = 0;
    public hover = 0;
    public wordFilter = '';
    public traditionFilter = '';
    public spellSource = 'spell library';
    public showLevel = 0;
    public range = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly spellsService: SpellsService,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly traitsService: TraitsService,
    ) { }

    set_Range(amount: number) {
        this.range += amount;
    }

    toggle_List(level: number) {
        if (this.showList == level) {
            this.showList = -1;
        } else {
            this.showList = level;
        }

        this.range = 0;
    }

    get_ShowList() {
        return this.showList;
    }

    toggle_Tradition(tradition: string) {
        this.traditionFilter = tradition;
    }

    get_ShowTradition() {
        return this.traditionFilter;
    }

    get_Traits(name = '') {
        return this.traitsService.traits(name);
    }

    trackByIndex(index: number): number {
        return index;
    }

    toggle_Item(id = '') {
        if (this.showItem == id) {
            this.showItem = '';
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    set_Changed(target: string) {
        this.refreshService.setComponentChanged(target);
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList == -2) {
            this.showList = -1;
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = -2;
        }
    }

    toggleSpellLibraryMenu() {
        this.characterService.toggleMenu('spelllibrary');
    }

    get_SpellLibraryMenuState() {
        return this.characterService.spellLibraryMenuState();
    }

    toggle_TileMode() {
        this.get_Character().settings.spellLibraryTileMode = !this.get_Character().settings.spellLibraryTileMode;
        this.refreshService.prepareDetailToChange('Character', 'spelllibrary');
        this.refreshService.processPreparedChanges();
    }

    get_TileMode() {
        return this.get_Character().settings.spellLibraryTileMode;
    }

    get_SpellbookMinimized() {
        return this.characterService.character().settings.spellbookMinimized;
    }

    get_Character() {
        return this.characterService.character();
    }

    get_Spells(name = '') {
        return this.spellsService.spells(name);
    }

    get_SpellsFromSource() {
        switch (this.spellSource.toLowerCase()) {
            case 'spell library':
                return this.get_Spells();
            case 'your spellbook':
                return this.get_Character().class?.spellBook.map(learned => this.get_Spells(learned.name)[0]).filter(spell => spell);
        }
    }

    get_VisibleSpells(level: number) {
        return this.get_SpellsFromSource()
            .filter((spell: Spell) =>
                (
                    (spell.levelreq == level && !spell.traits.includes('Cantrip')) ||
                    (level == 0 && spell.traits.includes('Cantrip'))
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
                        !spell.traditions.includes('Focus')
                ),
            )
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_WizardSpellCasting() {
        const casting: SpellCasting = this.get_Character().class?.spellCasting.find(casting => casting.className == 'Wizard' && casting.castingType == 'Prepared' && casting.charLevelAvailable <= this.get_Character().level);

        return casting || new SpellCasting('Innate');
    }

    get_BardSpellCasting() {
        const character = this.get_Character();
        const casting: SpellCasting = character.class?.spellCasting.find(casting => casting.className == 'Bard' && casting.castingType == 'Spontaneous' && casting.charLevelAvailable <= character.level);

        if (this.have_Feat('Esoteric Polymath')) {
            return casting || new SpellCasting('Innate');
        } else {
            return new SpellCasting('Innate');
        }
    }

    get_SorcererSpellCasting() {
        const character = this.get_Character();
        const casting: SpellCasting = character.class?.spellCasting.find(casting => casting.className == 'Sorcerer' && casting.castingType == 'Spontaneous' && casting.charLevelAvailable <= character.level);

        if (this.have_Feat('Arcane Evolution')) {
            return casting || new SpellCasting('Innate');
        } else {
            return new SpellCasting('Innate');
        }
    }

    get_School() {
        return this.characterService.characterFeatsTaken(1, this.get_Character().level).find(taken =>
            ['Abjuration School', 'Conjuration School', 'Divination School', 'Enchantment School', 'Evocation School',
                'Illusion School', 'Necromancy School', 'Transmutation School', 'Universalist Wizard'].includes(taken.name),
        )?.name || '';
    }

    get_LearningAvailable(wizardCasting: SpellCasting, bardCasting: SpellCasting, sorcererCasting: SpellCasting) {
        if (wizardCasting.className == 'Wizard' && wizardCasting.castingType == 'Prepared' && (this.traditionFilter == '' || this.traditionFilter == 'Arcane')) {
            let result = 'You can currently learn the following number of spells as a wizard:\n';
            const school = this.get_School();
            const charLevel: number = this.get_Character().level;
            let overdraw = 0;

            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(level => {
                let wizardLearned: number = this.get_SpellsLearned('', 'wizard', level).length;

                wizardLearned += overdraw;
                overdraw = 0;

                const schoolLearned: number = this.get_SpellsLearned('', 'school', level).length;
                let wizardAvailable = 0;
                let schoolAvailable = 0;
                let adaptedCantripAvailable = 0;
                let adaptiveAdeptCantripAvailable = 0;
                let adaptiveAdept1stLevelAvailable = 0;

                if (level == 0) {
                    wizardAvailable = wizardCasting.spellBookSlots[level];
                    adaptedCantripAvailable = this.have_Feat('Adapted Cantrip') ? 1 : 0;
                    adaptiveAdeptCantripAvailable = this.have_Feat('Adaptive Adept: Cantrip') ? 1 : 0;
                } else {
                    for (let index = level * 2 - 1; index <= charLevel && index <= level * 2; index++) {
                        wizardAvailable += wizardCasting.spellBookSlots[index];
                    }
                }

                if (level == 1 && school) {
                    if (school == 'Universalist Wizard') {
                        wizardAvailable += 1;
                    } else {
                        schoolAvailable = 1;
                    }
                }

                if (level == 1) {
                    adaptiveAdept1stLevelAvailable = this.have_Feat('Adaptive Adept: 1st-Level Spell') ? 1 : 0;
                }

                if (wizardAvailable < wizardLearned) {
                    overdraw += wizardLearned - wizardAvailable;
                    wizardLearned = wizardAvailable;
                }

                if (wizardAvailable || schoolAvailable) {
                    result += `\n${ wizardAvailable - wizardLearned - adaptedCantripAvailable - adaptiveAdeptCantripAvailable - adaptiveAdept1stLevelAvailable } of ${ wizardAvailable - adaptedCantripAvailable - adaptiveAdeptCantripAvailable - adaptiveAdept1stLevelAvailable }${ level == 0 ? ' Arcane Cantrips' : ` Arcane spell(s) up to level ${ level }` }`;

                    if (schoolAvailable) {
                        result += `\n${ schoolAvailable - schoolLearned } of ${ schoolAvailable } Arcane spell(s) of the ${ school.toLowerCase() } up to level ${ level }`;
                    }
                }

                if (adaptedCantripAvailable) {
                    const adaptedCantripLearned: number = this.get_SpellsLearned('', 'adaptedcantrip').length;

                    result += `\n${ 1 - adaptedCantripLearned } of ${ 1 } non-Arcane Cantrips via Adapted Cantrip`;
                }

                if (adaptiveAdeptCantripAvailable) {
                    const adaptedcantrip = this.get_SpellsLearned('', 'adaptedcantrip')[0];

                    if (adaptedcantrip) {
                        const originalSpell = this.get_Spells(adaptedcantrip.name)[0];

                        if (originalSpell) {
                            const adaptiveAdeptLearned: number = this.get_SpellsLearned('', 'adaptiveadept').length;

                            result += `\n${ 1 - adaptiveAdeptLearned } of ${ 1 } non-Arcane Cantrips of the following traditions via Adaptive Adept: ${ originalSpell.traditions.join(', ') }`;
                        }
                    }
                }

                if (adaptiveAdept1stLevelAvailable) {
                    const adaptedcantrip = this.get_SpellsLearned('', 'adaptedcantrip')[0];

                    if (adaptedcantrip) {
                        const originalSpell = this.get_Spells(adaptedcantrip.name)[0];

                        if (originalSpell) {
                            const adaptiveAdeptLearned: number = this.get_SpellsLearned('', 'adaptiveadept').length;

                            result += `\n${ 1 - adaptiveAdeptLearned } of ${ 1 } non-Arcane 1st-level spell of the following traditions via Adaptive Adept: ${ originalSpell.traditions.join(', ') }`;
                        }
                    }
                }
            });

            return result || '';
        } else if (bardCasting.className == 'Bard' && bardCasting.castingType == 'Spontaneous' && (this.get_EsotericPolymathAllowed(bardCasting, this.traditionFilter))) {
            let result = 'You can add any spell in your repertoire to your spellbook for free via esoteric polymath. You can learn and cast spells of the following traditions using esoteric polymath:\n';

            ['Arcane', 'Divine', 'Occult', 'Primal'].forEach(tradition => {
                if (this.get_EsotericPolymathAllowed(bardCasting, tradition)) {
                    result += `\n${ tradition }`;
                }
            });

            return result || '';
        } else if (sorcererCasting.className == 'Sorcerer' && sorcererCasting.castingType == 'Spontaneous' && (this.get_ArcaneEvolutionAllowed(sorcererCasting, this.traditionFilter))) {
            const result = 'You can add any spell in your repertoire to your spellbook for free via arcane evolution.';

            return result || '';
        } else {
            return '';
        }
    }

    get_AvailableForLearning(casting: SpellCasting, spell: Spell, adaptedCantrip = false, adaptiveAdept = false) {
        if (!adaptedCantrip && casting.className == 'Wizard' && casting.castingType == 'Prepared' && (this.traditionFilter == '' || this.traditionFilter == 'Arcane' || this.get_Character().getSpellsFromSpellList(spell.name).length)) {
            return !this.get_SpellsLearned(spell.name).length;
        }

        if (adaptedCantrip && casting.className == 'Wizard' && casting.castingType == 'Prepared' && (this.traditionFilter == '' || this.traditionFilter != 'Arcane')) {
            return this.have_Feat('Adapted Cantrip') && spell.traits.includes('Cantrip') && !this.get_SpellsLearned(spell.name).length;
        }

        if (adaptiveAdept && casting.className == 'Wizard' && casting.castingType == 'Prepared' && (this.traditionFilter == '' || this.traditionFilter != 'Arcane')) {
            return (this.have_Feat('Adaptive Adept: Cantrip') && spell.traits.includes('Cantrip') && !this.get_SpellsLearned(spell.name).length) ||
                (this.have_Feat('Adaptive Adept: 1st-Level Spell') && spell.levelreq == 1 && !this.get_SpellsLearned(spell.name).length);
        }

        if (casting.className == 'Bard' && casting.castingType == 'Spontaneous' && (this.traditionFilter == '' || this.traditionFilter == 'Occult' || this.get_Character().getSpellsFromSpellList(spell.name).length)) {
            return !this.get_SpellsLearned(spell.name).length;
        }

        if (casting.className == 'Sorcerer' && casting.castingType == 'Spontaneous' && (this.traditionFilter == '' || this.traditionFilter == 'Arcane' || this.get_Character().getSpellsFromSpellList(spell.name).length)) {
            return !this.get_SpellsLearned(spell.name).length;
        }
    }

    get_SpellsLearned(name = '', source = '', level = -1) {
        return this.get_Character().learnedSpells(name, source, level);
    }

    can_Learn(casting: SpellCasting, level: number, spell: Spell, source: string) {
        const character = this.get_Character();

        if (source == 'wizard' && casting.className == 'Wizard' && (spell.traditions.includes('Arcane') || character.getSpellsFromSpellList(spell.name).length)) {
            const charLevel: number = character.level;
            const wizardLearned: number = this.get_SpellsLearned('', 'wizard').filter(learned => learned.level == level && (learned.level > 0 || level == 0)).length;
            const wizardLearnedAll: number = this.get_SpellsLearned('', 'wizard').filter(learned => (level > 0 && learned.level > 0) || (level == 0 && learned.level == 0)).length;
            let wizardAvailable = 0;
            let wizardAvailableAll = 0;
            const adaptedCantripAvailable = this.have_Feat('Adapted Cantrip') ? 1 : 0;
            const adaptiveAdeptCantripAvailable = this.have_Feat('Adaptive Adept: Cantrip') ? 1 : 0;
            const adaptiveAdept1stLevelAvailable = this.have_Feat('Adaptive Adept: 1st-Level Spell') ? 1 : 0;

            if (level == 0) {
                wizardAvailable = casting.spellBookSlots[level] - adaptedCantripAvailable - adaptiveAdeptCantripAvailable;
                wizardAvailableAll = casting.spellBookSlots[level] - adaptedCantripAvailable - adaptiveAdeptCantripAvailable;
            } else {
                for (let index = level * 2 - 1; index <= charLevel; index++) {
                    wizardAvailable += casting.spellBookSlots[index];
                }

                for (let index = 1; index <= charLevel; index++) {
                    wizardAvailableAll += casting.spellBookSlots[index];
                }
            }

            if (level == 1 && this.get_School() == 'Universalist Wizard') {
                wizardAvailable += 1;
                wizardAvailableAll += 1;
            }

            if (level == 1) {
                wizardAvailable -= adaptiveAdept1stLevelAvailable;
                wizardAvailableAll -= adaptiveAdept1stLevelAvailable;
            }

            return wizardAvailable > wizardLearned && wizardAvailableAll > wizardLearnedAll;
        }

        if (source == 'school' && casting.className == 'Wizard' && (spell.traditions.includes('Arcane') || character.getSpellsFromSpellList(spell.name).length)) {
            const school = this.get_School();
            let schoolAvailable = 0;
            const schoolLearned: number = this.get_SpellsLearned('', 'school', level).length;

            if (level == 1 && school) {
                if (school != 'Universalist Wizard' && spell.traits.includes(school.split(' ')[0])) {
                    schoolAvailable += 1;
                }
            }

            return schoolAvailable > schoolLearned;
        }

        if (source == 'esotericpolymath' && casting.className == 'Bard') {
            if (spell.traditions.find(tradition => this.get_EsotericPolymathAllowed(casting, tradition))) {
                //You can learn a spell via esoteric polymath if it is in your spell repertoire, i.e. if you have chosen it for any spell slot.
                if (casting.spellChoices.find(choice => choice.spells.find(taken => taken.name == spell.name))) {
                    return true;
                }
            }
        }

        if (source == 'arcaneevolution' && casting.className == 'Sorcerer') {
            if (spell.traditions.find(tradition => this.get_ArcaneEvolutionAllowed(casting, tradition))) {
                //You can learn a spell via arcane evolution if it is in your spell repertoire, i.e. if you have chosen it for any spell slot.
                if (casting.spellChoices.find(choice => choice.spells.find(taken => taken.name == spell.name))) {
                    return true;
                }
            }
        }

        if (source == 'adaptedcantrip' && casting.className == 'Wizard') {
            //You can learn a spell via adapted cantrip if none of its traditions is your own.
            if (!spell.traditions.includes('Arcane')) {
                return this.get_SpellsLearned('', 'adaptedcantrip').length < 1;
            }
        }

        if (source == 'adaptiveadept' && casting.className == 'Wizard') {
            //You can learn a spell via adaptive adept if none of its traditions is your own, and it matches a tradition of the cantrip learned via adapted adept.
            //With Adaptive Adept, you can choose spells of the same tradition(s) as with Adapted Cantrip, but not your own.
            const adaptedcantrip = this.get_SpellsLearned('', 'adaptedcantrip')[0];

            if (adaptedcantrip) {
                const originalSpell = this.get_Spells(adaptedcantrip.name)[0];

                if (originalSpell) {
                    if (!spell.traditions.includes('Arcane') && spell.traditions.some(tradition => originalSpell.traditions.includes(tradition))) {
                        return this.get_SpellsLearned('', 'adaptiveadept').length < 1;
                    }
                }
            }
        }
    }

    learn_Spell(spell: Spell, source: string) {
        this.get_Character().learnSpell(spell, source);

        if (this.get_Character().settings.autoCloseChoices) { this.toggle_Item(); }

        this.refreshService.prepareDetailToChange('Character', 'spellchoices');
        this.refreshService.processPreparedChanges();
    }

    unlearn_Spell(spell: Spell) {
        this.get_Character().unlearnSpell(spell);
    }

    get_LearnedSpellSource(source: string) {
        switch (source) {
            case 'wizard':
                return '(learned as Wizard)';
            case 'esotericpolymath':
                return '(learned via Esoteric Polymath)';
            case 'arcaneevolution':
                return '(learned via Arcane Evolution)';
            case 'adaptedcantrip':
                return '(learned via Adapted Cantrip)';
            case 'adaptiveadept':
                return '(learned via Adaptive Adept)';
            case 'school':
                return `(learned via ${ this.get_School()?.toLowerCase() || 'school' })`;
            case 'free':
                return '(learned via Learn A Spell activity)';
        }
    }

    have_Feat(name: string) {
        return this.characterService.characterFeatsTaken(1, this.get_Character().level, { featName: name }).length;
    }

    get_SpellMasteryAvailable(casting: SpellCasting) {
        if (casting.className == 'Wizard' && casting.castingType == 'Prepared' && (this.traditionFilter == '' || this.traditionFilter == 'Arcane')) {
            if (this.have_Feat('Spell Mastery')) {
                const available = 4;
                const selected: Array<SpellChoice> = this.get_SpellMasterySpells(casting);
                let result = `You can select ${ available - selected.length } of ${ available } spells of different levels up to 9th level to automatically prepare via Spell Mastery.`;

                if (selected.length) {
                    result += ' You have already selected the following spells:\n';
                }

                selected
                    .sort((a, b) => (a.level == b.level) ? 0 : ((a.level > b.level) ? 1 : -1))
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

    get_AvailableForSpellMastery(casting: SpellCasting, spell: Spell) {
        if (spell.levelreq > 0 &&
            !spell.traits.includes('Cantrip') &&
            casting.className == 'Wizard' &&
            casting.castingType == 'Prepared' &&
            (this.traditionFilter == '' || this.traditionFilter == 'Arcane') &&
            this.have_Feat('Spell Mastery')) {
            return spell.traditions.includes(casting.tradition) && !this.get_SpellMasterySelected(casting, spell);
        }
    }

    get_SpellMasterySelected(casting: SpellCasting, spell: Spell) {
        return casting.spellChoices.find(choice => choice.source == 'Feat: Spell Mastery' && choice.spells.find(spellTaken => spellTaken.name == spell.name));
    }

    get_SpellMasterySpells(casting: SpellCasting) {
        return casting.spellChoices.filter(choice => choice.source == 'Feat: Spell Mastery' && choice.spells.length);
    }

    get_SpellMasteryAllowed(casting: SpellCasting, levelNumber: number, spell: Spell) {
        //Allow taking this spell if this spell or a spell of this level is not taken yet, and if no more than 3 of 4 spells are taken.
        return !casting.spellChoices.find(choice =>
            choice.source == 'Feat: Spell Mastery' &&
            (
                choice.level == levelNumber ||
                choice.spells.find(spellTaken => spellTaken.name == spell.name)
            ),
        ) &&
            casting.spellChoices.filter(choice => choice.source == 'Feat: Spell Mastery').length < 4;
    }

    add_SpellMasterySpell(spell: Spell) {
        const newChoice: SpellChoice = new SpellChoice();
        const newSpellTaken: SpellGain = new SpellGain();

        newChoice.className = 'Wizard';
        newChoice.castingType = 'Prepared';
        newChoice.source = 'Feat: Spell Mastery';
        newChoice.level = spell.levelreq;
        newSpellTaken.name = spell.name;
        newSpellTaken.locked = true;
        newSpellTaken.source = 'Feat: Spell Mastery';
        newChoice.spells.push(newSpellTaken);
        this.get_Character().addSpellChoice(this.characterService, spell.levelreq, newChoice);
        this.refreshService.processPreparedChanges();
    }

    remove_SpellMasterySpell(casting: SpellCasting, spell: Spell) {
        const oldChoice: SpellChoice = casting.spellChoices.find(choice => choice.source == 'Feat: Spell Mastery' && choice.spells.find(spellTaken => spellTaken.name == spell.name));

        if (oldChoice) {
            this.get_Character().removeSpellChoice(this.characterService, oldChoice);
        }

        this.refreshService.processPreparedChanges();
    }

    get_EsotericPolymathAllowed(casting: SpellCasting, tradition: string) {
        if (casting.className == 'Bard' && casting.castingType == 'Spontaneous' && this.have_Feat('Esoteric Polymath')) {
            if (['', 'Occult'].includes(tradition)) {
                return true;
            } else if (this.have_Feat('Impossible Polymath')) {
                const character = this.get_Character();
                let skill = '';

                switch (tradition) {
                    case 'Arcane':
                        skill = 'Arcana';
                        break;
                    case 'Divine':
                        skill = 'Religion';
                        break;
                    case 'Primal':
                        skill = 'Nature';
                        break;
                }

                return this.characterService.skills(character, skill)[0].level(character, this.characterService, character.level) >= 2;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    get_ArcaneEvolutionAllowed(casting: SpellCasting, tradition: string) {
        if (casting.className == 'Sorcerer' && casting.castingType == 'Spontaneous' && this.have_Feat('Arcane Evolution')) {
            if (tradition == 'Arcane') {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    public still_loading(): boolean {
        return this.spellsService.stillLoading() || this.characterService.stillLoading;
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.componentChanged$
            .subscribe(target => {
                if (['spelllibrary', 'all'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'character' && ['spelllibrary', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}

import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { SortByPipe } from '../sortBy.pipe';
import { Spell } from '../Spell';
import { SpellCasting } from '../SpellCasting';
import { SpellChoice } from '../SpellChoice';
import { SpellGain } from '../SpellGain';
import { TraitsService } from '../traits.service';

@Component({
    selector: 'app-spellLibrary',
    templateUrl: './spellLibrary.component.html',
    styleUrls: ['./spellLibrary.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellLibraryComponent implements OnInit {

    private showList: number = -1;
    private showItem: string = "";
    public id: number = 0;
    public hover: number = 0;
    public wordFilter: string = "";
    public traditionFilter: string = "";
    public spellSource: string = "spell library";
    public showLevel: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private spellsService: SpellsService,
        private characterService: CharacterService,
        private traitsService: TraitsService,
        public sortByPipe: SortByPipe
    ) { }

    toggle_List(level: number) {
        if (this.showList == level) {
            this.showList = -1;
        } else {
            this.showList = level;
        }
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

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    toggle_Item(id: string) {
        if (this.showItem == id) {
            this.showItem = "";
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    set_Changed(target: string) {
        this.characterService.set_Changed(target);
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
        this.characterService.toggle_Menu("spelllibrary");
    }

    get_SpellLibraryMenuState() {
        return this.characterService.get_SpellLibraryMenuState();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Spells(name: string = "") {
        return this.spellsService.get_Spells(name);
    }

    get_SpellsFromSource() {
        switch (this.spellSource.toLowerCase()) {
            case "spell library":
                return this.get_Spells();
            case "your spellbook":
                return this.get_Character().class?.spellBook.map(learned => this.get_Spells(learned.name)[0]).filter(spell => spell);
        }
    }

    get_VisibleSpells(level: number) {
        return this.get_SpellsFromSource().filter((spell: Spell) =>
            (
                (spell.levelreq == level && !spell.traits.includes("Cantrip")) ||
                (level == 0 && spell.traits.includes("Cantrip"))
            ) &&
            (
                !this.wordFilter || (
                    this.wordFilter && (
                        spell.name
                            .concat(spell.desc)
                            .concat(spell.area)
                            .concat(spell.targets)
                            .concat(spell.range)
                            .toLowerCase()
                            .includes(this.wordFilter.toLowerCase()) ||
                        spell.traits.filter(trait => trait.toLowerCase().includes(this.wordFilter.toLowerCase())).length
                    )
                )
            ) && (
                (
                    !this.traditionFilter && !spell.traditions.includes("Focus")
                ) || (
                    this.traditionFilter && spell.traditions.includes(this.traditionFilter)
                )
            )
        );
    }

    get_WizardSpellCasting() {
        let casting: SpellCasting = this.get_Character().class?.spellCasting.find(casting => casting.className == "Wizard" && casting.castingType == "Prepared" && casting.charLevelAvailable <= this.get_Character().level);
        return casting || new SpellCasting("Innate");
    }

    get_BardSpellCasting() {
        let character = this.get_Character();
        let casting: SpellCasting = character.class?.spellCasting.find(casting => casting.className == "Bard" && casting.castingType == "Spontaneous" && casting.charLevelAvailable <= character.level);
        if (this.have_Feat("Esoteric Polymath")) {
            return casting || new SpellCasting("Innate");
        } else {
            return new SpellCasting("Innate");
        }
    }

    get_School() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).find(taken =>
            ["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School",
                "Illusion School", "Necromancy School", "Transmutation School", "Universalist Wizard"].includes(taken.name)
        )?.name || "";
    }

    get_LearningAvailable(wizardCasting: SpellCasting, bardCasting: SpellCasting) {
        if (wizardCasting.className == "Wizard" && wizardCasting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter == "Arcane")) {
            let result: string = "You can currently learn the following number of spells as a wizard:\n";
            let school = this.get_School();
            let charLevel: number = this.get_Character().level;
            let overdraw: number = 0;
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(level => {
                let wizardLearned: number = this.get_SpellsLearned("", 'wizard', level).length;
                wizardLearned += overdraw;
                overdraw = 0;
                let schoolLearned: number = this.get_SpellsLearned("", 'school', level).length;
                let wizardAvailable: number = 0;
                let schoolAvailable: number = 0;
                let adaptedCantripAvailable: number = 0;
                let adaptiveAdeptCantripAvailable: number = 0;
                let adaptiveAdept1stLevelAvailable: number = 0;
                if (level == 0) {
                    wizardAvailable = wizardCasting.spellBookSlots[level];
                    adaptedCantripAvailable = this.have_Feat("Adapted Cantrip") ? 1 : 0;
                    adaptiveAdeptCantripAvailable = this.have_Feat("Adaptive Adept: Cantrip") ? 1 : 0;
                } else {
                    for (let index = level * 2 - 1; index <= charLevel && index <= level * 2; index++) {
                        wizardAvailable += wizardCasting.spellBookSlots[index];
                    }
                }
                if (level == 1 && school) {
                    if (school == "Universalist Wizard") {
                        wizardAvailable += 1
                    } else {
                        schoolAvailable = 1;
                    }
                }
                if (level == 1) {
                    adaptiveAdept1stLevelAvailable = this.have_Feat("Adaptive Adept: 1st-Level Spell") ? 1 : 0;
                }
                if (wizardAvailable < wizardLearned) {
                    overdraw += wizardLearned - wizardAvailable;
                    wizardLearned = wizardAvailable;
                }
                if (wizardAvailable || schoolAvailable) {
                    result += "\n" + (wizardAvailable - wizardLearned - adaptedCantripAvailable - adaptiveAdeptCantripAvailable - adaptiveAdept1stLevelAvailable) + " of " + (wizardAvailable - adaptedCantripAvailable - adaptiveAdeptCantripAvailable - adaptiveAdept1stLevelAvailable) + (level == 0 ? " Arcane Cantrips" : " Arcane spell(s) up to level " + level);
                    if (schoolAvailable) {
                        result += "\n" + (schoolAvailable - schoolLearned) + " of " + schoolAvailable + " Arcane spell(s) of the " + school.toLowerCase() + " up to level " + level;
                    }
                }
                if (adaptedCantripAvailable) {
                    let adaptedCantripLearned: number = this.get_SpellsLearned("", 'adaptedcantrip').length;
                    result += "\n" + (1 - adaptedCantripLearned) + " of " + 1 + " non-Arcane Cantrips via Adapted Cantrip";
                }
                if (adaptiveAdeptCantripAvailable) {
                    let adaptedcantrip = this.get_SpellsLearned("", 'adaptedcantrip')[0];
                    if (adaptedcantrip) {
                        let originalSpell = this.get_Spells(adaptedcantrip.name)[0];
                        if (originalSpell) {
                            let adaptiveAdeptLearned: number = this.get_SpellsLearned("", 'adaptiveadept').length;
                            result += "\n" + (1 - adaptiveAdeptLearned) + " of " + 1 + " non-Arcane Cantrips of the following traditions via Adaptive Adept: " + originalSpell.traditions.join(", ");
                        }
                    }
                }
                if (adaptiveAdept1stLevelAvailable) {
                    let adaptedcantrip = this.get_SpellsLearned("", 'adaptedcantrip')[0];
                    if (adaptedcantrip) {
                        let originalSpell = this.get_Spells(adaptedcantrip.name)[0];
                        if (originalSpell) {
                            let adaptiveAdeptLearned: number = this.get_SpellsLearned("", 'adaptiveadept').length;
                            result += "\n" + (1 - adaptiveAdeptLearned) + " of " + 1 + " non-Arcane 1st-level spell of the following traditions via Adaptive Adept: " + originalSpell.traditions.join(", ");
                        }
                    }
                }
            })
            return result || "";
        } else if (bardCasting.className == "Bard" && bardCasting.castingType == "Spontaneous" && (this.get_EsotericPolymathAllowed(bardCasting, this.traditionFilter))) {
            let result = "You can add any spell in your repertoire to your spellbook for free via esoteric polymath. You can learn and cast spells of the following traditions using esoteric polymath:\n";
            ["Arcane", "Divine", "Occult", "Primal"].forEach(tradition => {
                if (this.get_EsotericPolymathAllowed(bardCasting, tradition)) {
                    result += "\n" + tradition
                }
            });
            return result || "";
        } else {
            return ""
        }
    }

    get_AvailableForLearning(casting: SpellCasting, spell: Spell, adaptedCantrip: boolean = false, adaptiveAdept: boolean = false) {
        if (!adaptedCantrip && casting.className == "Wizard" && casting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter == "Arcane" || this.get_Character().get_SpellListSpell(spell.name).length)) {
            return !this.get_SpellsLearned(spell.name).length;
        }
        if (adaptedCantrip && casting.className == "Wizard" && casting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter != "Arcane")) {
            return this.have_Feat("Adapted Cantrip") && spell.traits.includes("Cantrip") && !this.get_SpellsLearned(spell.name).length;
        }
        if (adaptiveAdept && casting.className == "Wizard" && casting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter != "Arcane")) {
            return (this.have_Feat("Adaptive Adept: Cantrip") && spell.traits.includes("Cantrip") && !this.get_SpellsLearned(spell.name).length) ||
                (this.have_Feat("Adaptive Adept: 1st-Level Spell") && spell.levelreq == 1 && !this.get_SpellsLearned(spell.name).length);
        }
        if (casting.className == "Bard" && casting.castingType == "Spontaneous" && (this.traditionFilter == "" || this.traditionFilter == "Occult" || this.get_Character().get_SpellListSpell(spell.name).length)) {
            return !this.get_SpellsLearned(spell.name).length;
        }
    }

    get_SpellsLearned(name: string = "", source: string = "", level: number = -1) {
        return this.get_Character().get_SpellsLearned(name, source, level);
    }

    can_Learn(casting: SpellCasting, level: number, spell: Spell, source: string) {
        let character = this.get_Character();
        if (source == "wizard" && casting.className == "Wizard" && (spell.traditions.includes("Arcane") || character.get_SpellListSpell(spell.name).length)) {
            let charLevel: number = character.level;
            let wizardLearned: number = this.get_SpellsLearned("", 'wizard').filter(learned => learned.level == level && (learned.level > 0 || level == 0)).length;
            let wizardLearnedAll: number = this.get_SpellsLearned("", 'wizard').filter(learned => (level > 0 && learned.level > 0) || (level == 0 && learned.level == 0)).length;
            let wizardAvailable = 0;
            let wizardAvailableAll = 0;
            let adaptedCantripAvailable = this.have_Feat("Adapted Cantrip") ? 1 : 0;
            let adaptiveAdeptCantripAvailable = this.have_Feat("Adaptive Adept: Cantrip") ? 1 : 0;
            let adaptiveAdept1stLevelAvailable = this.have_Feat("Adaptive Adept: 1st-Level Spell") ? 1 : 0;
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
            if (level == 1 && this.get_School() == "Universalist Wizard") {
                wizardAvailable += 1
                wizardAvailableAll += 1;
            }
            if (level == 1) {
                wizardAvailable -= adaptiveAdept1stLevelAvailable;
                wizardAvailableAll -= adaptiveAdept1stLevelAvailable;
            }
            return wizardAvailable > wizardLearned && wizardAvailableAll > wizardLearnedAll;
        }
        if (source == "school" && casting.className == "Wizard" && (spell.traditions.includes("Arcane") || character.get_SpellListSpell(spell.name).length)) {
            let school = this.get_School();
            let schoolAvailable = 0;
            let schoolLearned: number = this.get_SpellsLearned("", 'school', level).length;
            if (level == 1 && school) {
                if (school != "Universalist Wizard" && spell.traits.includes(school.split(" ")[0])) {
                    schoolAvailable += 1
                }
            }
            return schoolAvailable > schoolLearned;
        }
        if (source == "esotericpolymath" && casting.className == "Bard") {
            if (spell.traditions.find(tradition => this.get_EsotericPolymathAllowed(casting, tradition))) {
                //You can learn a spell via esoteric polymath if it is in your spell repertoire, i.e. if you have chosen it for any spell slot.
                if (casting.spellChoices.find(choice => choice.spells.find(taken => taken.name == spell.name))) {
                    return true;
                }
            }
        }
        if (source == "adaptedcantrip" && casting.className == "Wizard") {
            //You can learn a spell via adapted cantrip if none of its traditions is your own.
            if (!spell.traditions.includes("Arcane")) {
                return this.get_SpellsLearned("", 'adaptedcantrip').length < 1;
            }
        }
        if (source == "adaptiveadept" && casting.className == "Wizard") {
            //You can learn a spell via adaptive adept if none of its traditions is your own, and it matches a tradition of the cantrip learned via adapted adept.
            //With Adaptive Adept, you can choose spells of the same tradition(s) as with Adapted Cantrip, but not your own.
            let adaptedcantrip = this.get_SpellsLearned("", 'adaptedcantrip')[0]
            if (adaptedcantrip) {
                let originalSpell = this.get_Spells(adaptedcantrip.name)[0];
                if (originalSpell) {
                    if (!spell.traditions.includes("Arcane") && spell.traditions.some(tradition => originalSpell.traditions.includes(tradition))) {
                        return this.get_SpellsLearned("", 'adaptiveadept').length < 1;
                    }
                }
            }
        }
    }

    learn_Spell(spell: Spell, source: string) {
        this.get_Character().learn_Spell(spell, source);
        this.toggle_Item("");
        this.characterService.set_Changed("spellchoices");
        this.characterService.process_ToChange();
    }

    unlearn_Spell(spell: Spell) {
        this.get_Character().unlearn_Spell(spell);
    }

    get_LearnedSpellSource(source: string) {
        switch (source) {
            case "wizard":
                return "(learned as Wizard)";
            case "esotericpolymath":
                return "(learned via Esoteric Polymath)";
            case "adaptedcantrip":
                return "(learned via Adapted Cantrip)";
            case "adaptiveadept":
                return "(learned via Adaptive Adept)";
            case "school":
                return "(learned via " + (this.get_School()?.toLowerCase() || "school") + ")";
            case "free":
                return "(learned via Learn A Spell activity)";
        }
    }

    have_Feat(name: string) {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level, name).length
    }

    get_SpellMasteryAvailable(casting: SpellCasting) {
        if (casting.className == "Wizard" && casting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter == "Arcane")) {
            if (this.have_Feat("Spell Mastery")) {
                let available = 4;
                let selected: SpellChoice[] = this.get_SpellMasterySpells(casting);
                let result: string = "You can select " + (available - selected.length) + " of " + (available) + " spells of different levels up to 9th level to automatically prepare via Spell Mastery.";
                if (selected.length) {
                    result += " You have already selected the following spells:\n"
                }
                selected.sort(function (a, b) {
                    if (a.level > b.level) {
                        return 1
                    }
                    if (a.level < b.level) {
                        return -1
                    }
                    return 0;
                }).forEach(choice => {
                    result += "\n" + choice.spells[0].name + " (level " + choice.level + ")"
                });
                return result;
            } else {
                return ""
            }
        } else {
            return ""
        }
    }

    get_AvailableForSpellMastery(casting: SpellCasting, spell: Spell) {
        if (spell.levelreq > 0 &&
            !spell.traits.includes("Cantrip") &&
            casting.className == "Wizard" &&
            casting.castingType == "Prepared" &&
            (this.traditionFilter == "" || this.traditionFilter == "Arcane") &&
            this.have_Feat("Spell Mastery")) {
            return spell.traditions.includes(casting.tradition) && !this.get_SpellMasterySelected(casting, spell);
        }
    }

    get_SpellMasterySelected(casting: SpellCasting, spell: Spell) {
        return casting.spellChoices.find(choice => choice.source == "Feat: Spell Mastery" && choice.spells.find(spellTaken => spellTaken.name == spell.name));
    }

    get_SpellMasterySpells(casting: SpellCasting) {
        return casting.spellChoices.filter(choice => choice.source == "Feat: Spell Mastery" && choice.spells.length);
    }

    get_SpellMasteryAllowed(casting: SpellCasting, levelNumber: number, spell: Spell) {
        //Allow taking this spell if this spell or a spell of this level is not taken yet, and if no more than 3 of 4 spells are taken.
        return !casting.spellChoices.find(choice =>
            choice.source == "Feat: Spell Mastery" &&
            (
                choice.level == levelNumber ||
                choice.spells.find(spellTaken => spellTaken.name == spell.name)
            )
        ) &&
            casting.spellChoices.filter(choice => choice.source == "Feat: Spell Mastery").length < 4;
    }

    add_SpellMasterySpell(spell: Spell) {
        let newChoice: SpellChoice = new SpellChoice();
        let newSpellTaken: SpellGain = new SpellGain();
        newChoice.className = "Wizard";
        newChoice.castingType = "Prepared";
        newChoice.source = "Feat: Spell Mastery";
        newChoice.level = spell.levelreq;
        newSpellTaken.name = spell.name;
        newSpellTaken.locked = true;
        newSpellTaken.source = "Feat: Spell Mastery";
        newChoice.spells.push(newSpellTaken);
        this.get_Character().add_SpellChoice(this.characterService, spell.levelreq, newChoice);
        this.characterService.process_ToChange();
    }

    remove_SpellMasterySpell(casting: SpellCasting, spell: Spell) {
        let oldChoice: SpellChoice = casting.spellChoices.find(choice => choice.source == "Feat: Spell Mastery" && choice.spells.find(spellTaken => spellTaken.name == spell.name));
        if (oldChoice) {
            this.get_Character().remove_SpellChoice(this.characterService, oldChoice);
        }
        this.characterService.process_ToChange();
    }

    get_EsotericPolymathAllowed(casting: SpellCasting, tradition: string) {
        if (casting.className == "Bard" && casting.castingType == "Spontaneous" && this.have_Feat("Esoteric Polymath")) {
            if (["", "Occult"].includes(tradition)) {
                return true;
            } else if (this.have_Feat("Impossible Polymath")) {
                let character = this.get_Character();
                let skill: string = "";
                switch (tradition) {
                    case "Arcane":
                        skill = "Arcana";
                        break;
                    case "Divine":
                        skill = "Religion";
                        break;
                    case "Primal":
                        skill = "Nature";
                        break;
                }
                return this.characterService.get_Skills(character, skill)[0].level(character, this.characterService, character.level) >= 2
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    still_loading() {
        return this.spellsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["spelllibrary", "all"].includes(target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == "Character" && ["spelllibrary", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
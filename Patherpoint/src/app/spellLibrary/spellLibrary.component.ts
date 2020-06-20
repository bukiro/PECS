import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { SortByPipe } from '../sortBy.pipe';
import { Spell } from '../Spell';
import { SpellCasting } from '../SpellCasting';

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
    
    constructor(
        private changeDetector: ChangeDetectorRef,
        private spellsService: SpellsService,
        private characterService: CharacterService,
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
        this.characterService.toggleMenu("spelllibrary");
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

    get_VisibleSpells( level: number) {
        return this.get_SpellsFromSource().filter((spell: Spell) =>
            (
                (spell.levelreq == level && !spell.traits.includes("Cantrip")) ||
                (level == 0 && spell.traits.includes("Cantrip"))
            ) &&
            (
                !this.wordFilter || (
                    this.wordFilter && (
                        spell.name.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                        spell.desc.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
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
        let casting: SpellCasting = this.get_Character().class?.spellCasting.find(casting => casting.className == "Wizard" && casting.castingType == "Prepared");
        return casting || new SpellCasting("Innate");
    }

    get_School() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).find(taken => 
            ["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School",
            "Illusion School", "Necromancy School", "Transmutation School", "Universalist Wizard"].includes(taken.name)
        )?.name || "";
    }

    get_WizardLearningAvailable(casting: SpellCasting) {
        if (casting.className == "Wizard" && casting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter == "Arcane")) {
            let result: string = "You can currently learn the following number of spells as a wizard:\n";
            let school = this.get_School();
            let charLevel: number = this.get_Character().level;
            let overdraw: number = 0;
            [0,1,2,3,4,5,6,7,8,9,10].forEach(level => {
                let wizardLearned: number = this.get_SpellsLearned("", 'wizard', level).length;
                wizardLearned += overdraw;
                overdraw = 0;
                let schoolLearned: number = this.get_SpellsLearned("", 'school', level).length;
                let wizardAvailable: number = 0;
                let schoolAvailable: number = 0;
                if (level == 0) {
                    wizardAvailable = casting.spellBookSlots[level];
                } else {
                    for (let index = level * 2 - 1; index <= charLevel && index <= level * 2; index++) {
                        wizardAvailable += casting.spellBookSlots[index];
                    }
                }
                if (level == 1 && school) {
                    if (school == "Universalist Wizard") {
                        wizardAvailable += 1
                    } else {
                        schoolAvailable = 1;
                    }
                }
                if (wizardAvailable < wizardLearned) {
                    overdraw += wizardLearned - wizardAvailable;
                    wizardLearned = wizardAvailable;
                }
                if (wizardAvailable || schoolAvailable) {
                    result += "\n" + (wizardAvailable - wizardLearned) + (level == 0 ? " Arcane Cantrips" : " Arcane spell(s) up to level " + level);
                    if (schoolAvailable) {
                        result += "\n" + (schoolAvailable - schoolLearned) + " Arcane spell(s) of the " + school.toLowerCase() + " up to level " + level;
                    }
                }
            })
            return result || "";
        } else {
            return ""
        }
    }

    get_AvailableForLearning(casting: SpellCasting, spell: Spell) {
        if (casting.className == "Wizard" && casting.castingType == "Prepared" && (this.traditionFilter == "" || this.traditionFilter == "Arcane")) {
            return !this.get_SpellsLearned(spell.name).length;
        }
    }

    get_SpellsLearned(name: string = "", source: string = "", level: number = -1) {
        return this.get_Character().get_SpellsLearned(name, source, level);
    }

    can_Learn(casting: SpellCasting, level: number, spell: Spell, source: string) {
        if (source == "wizard" && spell.traditions.includes("Arcane")) {
            let charLevel: number = this.get_Character().level;
            let wizardLearned: number = this.get_SpellsLearned("", 'wizard').filter(learned => learned.level == level && (learned.level > 0 || level == 0)).length;
            let wizardLearnedAll: number = this.get_SpellsLearned("", 'wizard').filter(learned => (level > 0 && learned.level > 0) || (level == 0 && learned.level == 0)).length;
            let wizardAvailable = 0;
            let wizardAvailableAll = 0;
            if (level == 0) {
                wizardAvailable = casting.spellBookSlots[level];
                wizardAvailableAll = casting.spellBookSlots[level];
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
            }
            return wizardAvailable > wizardLearned && wizardAvailableAll > wizardLearnedAll;
        }
        if (source == "school" && spell.traditions.includes("Arcane")) {
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
    }

    learn_Spell(spell: Spell, source: string) {
        this.get_Character().learn_Spell(spell, source);
        this.toggle_Item("");
    }

    unlearn_Spell(spell: Spell) {
        this.get_Character().unlearn_Spell(spell);
    }

    get_LearnedSpellSource(source: string) {
        switch (source) {
            case "wizard":
                return "(learned as wizard)";
            case "school":
                return "(learned via " + this.get_School().toLowerCase() + ")";
            case "free":
                return "(learned via Learn A Spell activity)";
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
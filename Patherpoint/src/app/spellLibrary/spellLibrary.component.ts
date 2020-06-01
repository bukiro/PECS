import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { SortByPipe } from '../sortBy.pipe';
import { Spell } from '../Spell';

@Component({
    selector: 'app-spellLibrary',
    templateUrl: './spellLibrary.component.html',
    styleUrls: ['./spellLibrary.component.css']
})
export class SpellLibraryComponent implements OnInit {

    private showList: number = -1;
    private showItem: string = "";
    public id: number = 0;
    public hover: number = 0;
    public wordFilter: string = "";
    public traditionFilter: string = "";
    
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

    get_Spells() {
        return this.spellsService.get_Spells();
    }

    get_VisibleSpells( level: number) {
        return this.get_Spells().filter((spell: Spell) =>
            spell.levelreq == level &&
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

    learn_Spell(spell: Spell) {
        //this.characterService.learn_Spell(spell);
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
                if (["items", "all"].includes(target)) {
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
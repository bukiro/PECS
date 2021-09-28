import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Spell } from 'src/app/Spell';
import { CharacterService } from 'src/app/character.service';
import { SpellCasting } from 'src/app/SpellCasting';
import { SpellsService } from 'src/app/spells.service';
import { TraitsService } from 'src/app/traits.service';

@Component({
    selector: 'app-spellContent',
    templateUrl: './spellContent.component.html',
    styleUrls: ['./spellContent.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellContentComponent implements OnInit {

    @Input()
    spell: Spell
    @Input()
    spellLevel: number;
    @Input()
    casting: SpellCasting = null;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Heightened(desc: string) {
        let levelNumber = this.spellLevel;
        if (!levelNumber || levelNumber == -1) {
            levelNumber = this.characterService.get_Character().get_SpellLevel();
        }
        if (this.spell.levelreq && levelNumber < this.spell.levelreq) {
            levelNumber = this.spell.levelreq;
        }
        return this.spell.get_Heightened(desc, levelNumber)
    }

    get_Spells(name: string) {
        return this.spellsService.get_Spells(name);
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["individualspells", "all", "character"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" &&
                        (
                            view.target.toLowerCase() == "all" ||
                            (view.target.toLowerCase() == "individualspells" && [this.spell.name.toLowerCase(), "all"].includes(view.subtarget.toLowerCase()))
                        )) {
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

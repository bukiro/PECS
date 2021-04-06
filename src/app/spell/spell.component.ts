import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { SpellsService } from '../spells.service';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-spell',
    templateUrl: './spell.component.html',
    styleUrls: ['./spell.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellComponent implements OnInit {

    @Input()
    spell: Spell
    @Input()
    spellLevel: number;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        popoverConfig: NgbPopoverConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        //For touch compatibility, this openDelay prevents the popover from closing immediately on tap because a tap counts as hover and then click;
        popoverConfig.openDelay = 1;
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "hover:click";
    }

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
        } else if (this.spell.levelreq && levelNumber < this.spell.levelreq) {
            levelNumber = this.spell.levelreq;
        }
        return this.spell.get_Heightened(desc, levelNumber)
    }

    get_FeatsShowingOn(spellName: string) {
        return this.characterService.get_FeatsShowingOn(spellName);
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

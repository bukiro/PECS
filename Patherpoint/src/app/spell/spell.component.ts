import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { SpellsService } from '../spells.service';

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
            levelNumber = Math.ceil(this.characterService.get_Character().level / 2)
        } 
        return this.spell.get_Heightened(desc, levelNumber)
    }

    get_FeatsShowingOn(spellName: string) {
        return this.characterService.get_FeatsShowingOn(spellName);
    }

    get_Spells(name: string) {
        return this.spellsService.get_Spells(name);
    }

    ngOnInit() {
    }

}

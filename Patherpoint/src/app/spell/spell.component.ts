import { Component, OnInit, Input } from '@angular/core';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';

@Component({
    selector: 'app-spell',
    templateUrl: './spell.component.html',
    styleUrls: ['./spell.component.css']
})
export class SpellComponent implements OnInit {

    @Input()
    spell: Spell
    @Input()
    spellLevel: number

    constructor(
        private characterService: CharacterService,
        private traitsService: TraitsService
    ) { }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_SpellDescription(spell: Spell, levelNumber?:number) {
        if (!levelNumber) {
            if (this.spellLevel) {
                levelNumber = this.spellLevel;
            } else {
                levelNumber = Math.ceil(this.characterService.get_Character().level / 2);
            }
        }
        return spell.get_Description(levelNumber)
    }

    get_FeatsShowingOn(spellName: string) {
        return this.characterService.get_FeatsShowingOn(spellName);
    }

    ngOnInit() {
    }

}

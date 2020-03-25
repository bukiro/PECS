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

    constructor(
        private characterService: CharacterService,
        private traitsService: TraitsService
    ) { }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_SpellDescription(spell: Spell, levelNumber?:number) {
        if (!levelNumber) {
            levelNumber = Math.ceil(this.characterService.get_Character().level / 2);
        }
        return spell.get_Description(levelNumber)
    }

    ngOnInit() {
    }

}

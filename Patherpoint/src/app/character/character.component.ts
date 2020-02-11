import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';
import { Class } from '../Class';

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.css']
})
export class CharacterComponent implements OnInit {

    public newClass: Class = new Class();

    constructor(
        public characterService: CharacterService,
        public classesService: ClassesService
    ) { }

    toggleCharacterMenu(position: string = "") {
        this.characterService.toggleCharacterMenu(position);
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Abilities(key:string = "", value = undefined) {
        return this.characterService.get_Abilities(key, value)
    }

    get_AbilityBoosts(levelNumber: number, ability) {
        return this.characterService.get_AbilityBoosts(levelNumber, ability);
    }

    onAbilityBoost(level, ability, boost) {
        this.characterService.boostAbility(level, ability, boost);
    }

    get_Classes() {
        return this.classesService.get_Classes();
    }

    onClassChange(event) {
        this.characterService.changeClass(this.classesService.get_Classes(event)[0]);
    }

    ngOnInit() {
    }

}

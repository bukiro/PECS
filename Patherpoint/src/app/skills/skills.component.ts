import { Component, OnInit } from '@angular/core';
import { SkillsService } from '../skills.service';
import { AbilitiesService } from '../abilities.service';
import { CharacterService } from '../character.service';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css']
})
export class SkillsComponent implements OnInit {

    constructor(
        public skillsService: SkillsService,
        public characterService: CharacterService,
        public abilitiesService: AbilitiesService
    ) { }

    get_Skills(key:string = "", value = undefined, key2:string = "", value2 = undefined, key3:string = "", value3 = undefined) {
        return this.skillsService.get_Skills(key, value, key2, value2, key3, value3);
    }

    remove_Lore(skill) {
        this.characterService.remove_Lore(skill);
    }

    still_loading() {
        return this.skillsService.still_loading();
    }

    ngOnInit() {
        this.skillsService.initialize();
    }

}
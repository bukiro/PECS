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

    get_Skills(key:string = "", value:string = "") {
        return this.skillsService.get_Skills();
    }

    still_loading() {
        return this.skillsService.still_loading();
    }

    ngOnInit() {
        this.skillsService.initialize();
    }

}
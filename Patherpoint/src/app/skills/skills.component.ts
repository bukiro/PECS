import { Component, OnInit } from '@angular/core';
import { AbilitiesService } from '../abilities.service';
import { CharacterService } from '../character.service';
import { SkillsService } from '../skills.service';
import { TraitsService } from '../traits.service';
import { Skill } from '../Skill';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css']
})
export class SkillsComponent implements OnInit {

    constructor(
        public characterService: CharacterService,
        public abilitiesService: AbilitiesService,
        public skillsService: SkillsService,
        public traitsService: TraitsService
    ) { }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type);
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    still_loading() {
        return this.skillsService.still_loading();
    }

    ngOnInit() {
        this.skillsService.initialize();
    }

}
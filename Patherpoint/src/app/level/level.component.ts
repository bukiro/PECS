import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';

@Component({
    selector: 'app-level',
    templateUrl: './level.component.html',
    styleUrls: ['./level.component.css']
})
export class LevelComponent implements OnInit {

    constructor(
        public characterService: CharacterService,
        public classesService: ClassesService
    ) { }

    get_Levels(number: number = 0) {
        
    }

    ngOnInit() {
    }

}

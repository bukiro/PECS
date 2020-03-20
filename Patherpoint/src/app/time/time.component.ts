import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.css']
})
export class TimeComponent implements OnInit {

    constructor(
        private characterService: CharacterService,
        private timeService: TimeService
    ) { }

    ngOnInit() {
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    still_loading() {
        return this.characterService.still_loading()
    }

    get_YourTurn() {
        return this.timeService.get_YourTurn();
    }

    tick(amount: number) {
        this.timeService.tick(this.characterService, amount);
    }

}

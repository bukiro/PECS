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
    
    get_Duration(duration) {
        let durationNum = duration;
        let returnString: string = ""
        if (durationNum / 144000 >= 1) {
            returnString += Math.floor(durationNum / 144000)+" Day"
            if (durationNum / 144000 >= 2) { returnString += "s" }
            durationNum %= 144000;
        }
        if (durationNum / 6000 >= 1) {
            returnString += " "+Math.floor(durationNum / 6000)+" Hour"
            if (durationNum / 6000 >= 2) { returnString += "s" }
            durationNum %= 6000;
        }
        if (durationNum / 100 >= 1) {
            returnString += " "+Math.floor(durationNum / 100)+" Minute"
            if (durationNum / 100 >= 2) { returnString += "s" }
            durationNum %= 100;
        }
        if (durationNum >= 10) {
            returnString += " "+Math.floor(durationNum / 10)+" Turn"
            if (durationNum / 10 > 1) { returnString += "s" }
            durationNum %= 10;
        }
        return returnString;
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

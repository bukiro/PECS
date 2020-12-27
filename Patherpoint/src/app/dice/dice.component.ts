import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.css']
})
export class DiceComponent implements OnInit {

    public diceResult: {roll:string, result:number}[] = [];
    public diceNum: number = 5;

    constructor(
        private characterService: CharacterService,
        private changeDetector: ChangeDetectorRef
    ) { }

    toggleDiceMenu() {
        this.characterService.toggle_Menu("dice");
    }

    roll(amount: number, size: number) {
        for (let index = 0; index < amount; index++) {
            this.diceResult.push({roll:"d"+size, result:Math.ceil(Math.random() * size)});
        }
    }

    get_DiceSummary() {
        let summary: string[] = [];
        ["d4","d6","d8","d10","d12","d20"].forEach(die => {
            let count = this.diceResult.filter(result => result.roll == die).length;
            if (count) {
                summary.push(count + die);
            }
        })
        return summary.join(", ");
    }

    get_DiceSum() {
        return this.diceResult.reduce((a , b) => a + b.result, 0);
    }

    clear() {
        this.diceResult.length = 0;
    }

    ngOnInit() {
    }

}

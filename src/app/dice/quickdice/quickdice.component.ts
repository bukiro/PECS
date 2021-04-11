import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { DiceService } from 'src/app/dice.service';

@Component({
    selector: 'app-quickdice',
    templateUrl: './quickdice.component.html',
    styleUrls: ['./quickdice.component.scss']
})
export class QuickdiceComponent implements OnInit {

    @Input()
    private diceNum: number = 0;
    @Input()
    private diceSize: number = 0;
    @Input()
    private bonus: number = 0;
    @Input()
    private type: string = "";
    @Input()
    private diceString: string = "";

    constructor(
        private characterService: CharacterService,
        private diceService: DiceService
    ) { }

    roll() {
        if (this.diceNum && this.diceSize) {
            this.diceService.roll(this.diceNum, this.diceSize, this.bonus, this.characterService, true, (this.type ? " " + this.type : ""));
        } else if (this.diceString) {
            let diceString = this.diceString.replace("\n", " ");
            let diceRolls: {diceNum: number, diceSize: number, bonus: number, type: string}[] = [];
            let index = 0;
            let arithmetic: string = "";
            diceString.trim().split(" ").map(part => part.trim()).forEach(dicePart => {
                if (dicePart.match("^[0-9]+d[0-9]+$")) {
                    if (diceRolls.length == 0 || diceRolls[index].diceNum || diceRolls[index].diceSize) {
                        index = diceRolls.push({diceNum: 0, diceSize: 0, bonus: 0, type: ""}) - 1;
                    }
                    diceRolls[index].diceNum = parseInt(dicePart.split("d")[0]);
                    diceRolls[index].diceSize = parseInt(dicePart.split("d")[1]);
                } else if (dicePart == "+" || dicePart == "-") {
                    arithmetic = dicePart;
                } else if (dicePart.match("^[0-9]+$")) {
                    if (diceRolls.length == 0 || diceRolls[index].bonus) {
                        index = diceRolls.push({diceNum: 0, diceSize: 0, bonus: 0, type: ""}) - 1;
                    }
                    if (arithmetic) {
                        diceRolls[index].bonus = parseInt(arithmetic + dicePart);
                        arithmetic = "";
                    }
                } else {
                    if (diceRolls[index]) {
                        diceRolls[index].type += " " + dicePart;
                    }
                }
            });
            diceRolls.forEach((diceRoll, index) => {
                this.diceService.roll(diceRoll.diceNum, diceRoll.diceSize, diceRoll.bonus, this.characterService, index == 0, diceRoll.type);
            });
        }
    }

    get_Description() {
        if (this.diceString) {
            return this.diceString.replace("\n", " ");
        } else if (this.diceNum && this.diceSize) {
            return this.diceNum + "d" + this.diceSize + (this.bonus > 0 ? " + " + this.bonus : " - " + (this.bonus * -1)) + (this.type ? " " + this.type : "");
        }
    }

    ngOnInit() {
    }

}

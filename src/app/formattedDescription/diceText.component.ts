import { Component, Input, OnInit } from '@angular/core';
import { SpellCasting } from '../SpellCasting';

@Component({
    selector: 'app-diceText',
    templateUrl: './diceText.component.html',
    styleUrls: ['./diceText.component.scss']
})
export class DiceTextComponent implements OnInit {

    @Input()
    text: string = "";
    @Input()
    casting: SpellCasting = null;

    constructor() { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_DiceSplit() {
        let diceStart = new RegExp("<dice>", "g");
        let diceEnd = new RegExp("</dice>", "g");
        return this.text.replace(diceEnd,"|").replace(diceStart,"|quickdice-").split("|");
    }

    ngOnInit() {
    }

}

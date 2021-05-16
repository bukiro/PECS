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
    @Input()
    oneLiner: boolean = false;

    constructor() { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    ngOnInit() {
    }

}

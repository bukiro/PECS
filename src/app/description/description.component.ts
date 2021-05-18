import { Component, Input, OnInit } from '@angular/core';
import { SpellCasting } from '../SpellCasting';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss']
})
export class DescriptionComponent implements OnInit {

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

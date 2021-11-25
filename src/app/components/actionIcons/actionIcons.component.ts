import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-actionIcons',
    templateUrl: './actionIcons.component.html',
    styleUrls: ['./actionIcons.component.css']
})
export class ActionIconsComponent implements OnInit {

    @Input()
    actionString: string = ""
    
    constructor() { }

    get_Phrases() {
        return this.actionString?.split(' ') || [];
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    ngOnInit() {
    }

}

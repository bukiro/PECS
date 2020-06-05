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

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    ngOnInit() {
    }

}

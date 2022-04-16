import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-actionIcons',
    templateUrl: './actionIcons.component.html',
    styleUrls: ['./actionIcons.component.css']
})
export class ActionIconsComponent {

    @Input()
    actionString = '';

    get_Phrases() {
        return this.actionString?.split(' ') || [];
    }

    trackByIndex(index: number): number {
        return index;
    }

}

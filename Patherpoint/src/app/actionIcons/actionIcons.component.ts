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

    get_ActionIcons() {
        /*return this.actionString
            .replace("Free", "<svg><use xlink:href='assets/img/Free.svg'></use></svg>")
            .replace("Reaction", "<svg><use xlink:href='assets/img/Reaction.svg'></use></svg>")
            .replace("1A", "<app-actionIcons_1A></app-actionIcons_1A>")
            .replace("2A", "<svg><use xlink:href='assets/img/2A.svg'></use></svg>")
            .replace("3A", "<svg><use xlink:href='assets/img/3A.svg'></use></svg>");
            */
    }

    ngOnInit() {
    }

}

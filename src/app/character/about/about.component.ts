import { Component, OnInit } from '@angular/core';
import welcome from '../../../assets/json/about/welcome.json';
import hints from '../../../assets/json/about/hints.json';
import changelog from '../../../assets/json/about/changelog.json';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

    public version: string = "";

    welcome: { header: string, desc: string }[] = welcome;
    hints: { header: string, desc: string, images: string[] }[] = hints;
    changelog: { version: string, changes: { desc: string, images: string[] }[] }[] = changelog;

    constructor() { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_VersionShown() {
        return this.changelog.find(versionChange => versionChange.version == this.version);
    }

    ngOnInit() {
        this.version = changelog[0]?.version || "";
    }

}

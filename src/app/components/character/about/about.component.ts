import { Component, OnInit } from '@angular/core';
import welcome from 'src/assets/json/about/welcome.json';
import hints from 'src/assets/json/about/hints.json';
import changelog from 'src/assets/json/about/changelog.json';
import { ConfigService } from 'src/app/services/config.service';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

    public version = '';

    welcome: { header: string, desc: string }[] = welcome;
    hints: { header: string, desc: string, images: { file: string, title: string }[] }[] = hints;
    changelog: { version: string, changes: { header: string, desc: string, images: { file: string, title: string }[] }[] }[] = changelog;

    constructor(
        private configService: ConfigService
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_VersionShown() {
        return this.changelog.find(versionChange => versionChange.version == this.version);
    }

    get_UpdateAvailable() {
        const updateAvailable = this.configService.get_UpdateAvailable();
        if (updateAvailable == 'n/a') {
            return [{ available: false, desc: 'PECS was unable to check for new versions.' }];
        } else if (updateAvailable) {
            return [{ available: true, desc: `Version ${ updateAvailable } is available for download!` }];
        } else {
            return [{ available: false, desc: '' }];
        }
    }

    ngOnInit() {
        this.version = changelog[0]?.version || '';
    }

}

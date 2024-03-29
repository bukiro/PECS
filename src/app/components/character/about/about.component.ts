import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import welcome from 'src/assets/json/about/welcome.json';
import hints from 'src/assets/json/about/hints.json';
import changelog from 'src/assets/json/about/changelog.json';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { Trackers } from 'src/libs/shared/util/trackers';

interface ChangeLog {
    version: string;
    changes: Array<{ header: string; desc: string; images: Array<{ file: string; title: string }> }>;
}

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {

    public version = '';

    public welcome: Array<{ header: string; desc: string }> = welcome;
    public hints: Array<{ header: string; desc: string; images: Array<{ file: string; title: string }> }> = hints;
    public changelog: Array<ChangeLog> = changelog;

    constructor(
        private readonly _configService: ConfigService,
        public trackers: Trackers,
    ) { }

    public versionShown(): ChangeLog | undefined {
        return this.changelog.find(versionChange => versionChange.version === this.version);
    }

    public updateAvailable(): { available: boolean; desc: string } {
        const updateAvailable = this._configService.updateAvailable;

        if (updateAvailable === 'n/a') {
            return { available: false, desc: 'PECS was unable to check for new versions.' };
        } else if (updateAvailable) {
            return { available: true, desc: `Version ${ updateAvailable } is available for download!` };
        } else {
            return { available: false, desc: '' };
        }
    }

    public ngOnInit(): void {
        this.version = changelog[0]?.version || '';
    }

}

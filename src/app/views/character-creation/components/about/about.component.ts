import { ChangeDetectionStrategy, Component } from '@angular/core';
import welcome from 'src/assets/json/about/welcome.json';
import hints from 'src/assets/json/about/hints.json';
import changelog from 'src/assets/json/about/changelog.json';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ChangeLog {
    version: string;
    changes: Array<{ header: string; desc: string; images: Array<{ file: string; title: string }> }>;
}

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DescriptionComponent,
    ],
})
export class AboutComponent extends TrackByMixin(BaseClass) {

    public welcome: Array<{ header: string; desc: string }> = welcome;
    public hints: Array<{ header: string; desc: string; images: Array<{ file: string; title: string }> }> = hints;
    public changelog: Array<ChangeLog> = changelog;

    public updateAvailable$: Observable<{ available: boolean; desc: string }>;

    public selectedVersionLog$: BehaviorSubject<ChangeLog | undefined>;

    private _selectedVersion = '';

    constructor(
        private readonly _configService: ConfigService,
    ) {
        super();

        this.updateAvailable$ = this._configService.updateVersionAvailable$
            .pipe(
                map(updateAvailable => {
                    if (updateAvailable === 'n/a') {
                        return { available: false, desc: 'PECS was unable to check for new versions.' };
                    } else if (updateAvailable) {
                        return { available: true, desc: `Version ${ updateAvailable } is available for download!` };
                    } else {
                        return { available: false, desc: '' };
                    }
                }),
            );

        this._selectedVersion = changelog[0]?.version || '';

        this.selectedVersionLog$ =
            new BehaviorSubject<ChangeLog | undefined>(
                this.changelog[0],
            );
    }

    public set version(version: string) {
        this._selectedVersion = version;
        this.selectedVersionLog$.next(this.changelog.find(versionChange => versionChange.version === this._selectedVersion));
    }

    public get version(): string {
        return this._selectedVersion;
    }

}

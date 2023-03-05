import { ChangeDetectionStrategy, Component } from '@angular/core';
import cup from 'src/assets/json/licenses/cup.json';
import ogl from 'src/assets/json/licenses/ogl.json';
import ogl15 from 'src/assets/json/licenses/ogl15.json';
import { Trackers } from 'src/libs/shared/util/trackers';

@Component({
    selector: 'app-licenses',
    templateUrl: './licenses.component.html',
    styleUrls: ['./licenses.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicensesComponent {


    public cup: { title: string; desc: string } = cup;
    public ogl: Array<{ title: string; desc: string }> = ogl;
    public ogl15: Array<{ header: string; lines: Array<{ title: string; desc: string }> }> = ogl15;

    constructor(
        public trackers: Trackers,
    ) { }
}

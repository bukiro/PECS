import { Component, OnInit } from '@angular/core';
import cup from 'src/assets/json/licenses/cup.json';
import ogl from 'src/assets/json/licenses/ogl.json';
import ogl15 from 'src/assets/json/licenses/ogl15.json';

@Component({
    selector: 'app-licenses',
    templateUrl: './licenses.component.html',
    styleUrls: ['./licenses.component.css']
})
export class LicensesComponent implements OnInit {

    cup: { title: string; desc: string } = cup;
    ogl: Array<{ title: string; desc: string }> = [];
    ogl15: Array<{ header: string; lines: Array<{ title: string; desc: string }> }> = [];

    trackByIndex(index: number): number {
        return index;
    }

    public ngOnInit(): void {
        Object.keys(ogl).forEach(key => {
            this.ogl.push({ title: ogl[key].title, desc: ogl[key].desc });
        });
        Object.keys(ogl15).forEach(key => {
            this.ogl15.push({ header: ogl15[key].header, lines: ogl15[key].lines.map(line => { return { title: line.title, desc: line.desc }; }) });
        });
    }
}

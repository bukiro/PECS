import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DiamondComponent } from '../diamond/diamond.component';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-loading-diamond',
    templateUrl: '../diamond/diamond.component.html',
    styleUrls: ['../diamond/diamond.component.scss', './loading-diamond.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        NgbTooltipModule,
    ],
})
export class LoadingDiamondComponent extends DiamondComponent {
}

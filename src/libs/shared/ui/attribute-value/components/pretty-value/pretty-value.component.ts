import { Component, ChangeDetectionStrategy, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { forceBooleanFromInput } from 'src/libs/shared/util/component-input-utils';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { BonusListComponent } from 'src/libs/shared/ui/bonus-list/components/bonus-list/bonus-list.component';

@Component({
    selector: 'app-pretty-value',
    templateUrl: './pretty-value.component.html',
    styleUrls: ['./pretty-value.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbPopoverModule,

        BonusListComponent,
    ],
})
export class PrettyValueComponent {
    @Input()
    public value?: number | string;

    @Input()
    public clickLabel?: string;

    public opaque = input<boolean, boolean | string | number>(false, { transform: value => forceBooleanFromInput(value) });

    public hasBonuses = false;
    public hasPenalties = false;
    public hasAbsolutes = false;

    private _bonuses?: Array<BonusDescription>;

    public get bonuses(): Array<BonusDescription> | undefined {
        return this._bonuses;
    }

    @Input()
    public set bonuses(bonuses: Array<BonusDescription> | undefined) {
        this._bonuses = bonuses;
        this.hasBonuses = !!bonuses?.some(bonus => bonus.isBonus);
        this.hasPenalties = !!bonuses?.some(bonus => bonus.isPenalty);
        this.hasAbsolutes = !!bonuses?.some(bonus => bonus.isAbsolute);
    }
}

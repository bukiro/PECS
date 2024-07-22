
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { forceBooleanFromInput } from 'src/libs/shared/util/component-input-utils';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgbTooltipModule,
    ],
})
export class ButtonComponent {

    @ViewChild('Button')
    public button?: ElementRef<HTMLButtonElement>;

    @Input()
    public label?: string;

    @Output()
    public readonly clicked = new EventEmitter<undefined>();

    @HostBinding('class.full-size')
    public isFullSize?: boolean;

    @HostBinding('class.disabled')
    public isDisabled?: boolean;

    @HostBinding('class.processing')
    public isProcessing?: boolean;

    @HostBinding('class.toggled')
    public isToggled?: boolean;

    @HostBinding('class.ghost')
    public isGhost?: boolean;

    @HostBinding('class.danger')
    public isDanger?: boolean;

    @HostBinding('class.no-outline')
    public isNotOutlined?: boolean;

    @HostBinding('class.compact')
    public isCompact?: boolean;

    @HostBinding('class.tight')
    public isTight?: boolean;

    @HostBinding('class.circle')
    public isCircle?: boolean;

    @HostBinding('class.tab-like')
    public isTabLike?: boolean;

    @HostBinding('class.left-aligned')
    private _isLeftAligned = false;

    @HostBinding('class.center-aligned')
    private _isCenterAligned = true;

    @HostBinding('class.right-aligned')
    private _isRightAligned = false;

    public shouldHideLabel = false;

    private _alignment: 'left' | 'right' | 'center' = 'center';

    @Input()
    public set fullSize(fullSize: boolean | string | undefined) {
        this.isFullSize = forceBooleanFromInput(fullSize);
    }

    @Input()
    public set disabled(disabled: boolean | string | undefined) {
        this.isDisabled = forceBooleanFromInput(disabled);
    }

    @Input()
    public set processing(processing: boolean | string | undefined) {
        this.isProcessing = forceBooleanFromInput(processing);
    }

    @Input()
    public set toggled(toggled: boolean | string | undefined) {
        this.isToggled = forceBooleanFromInput(toggled);
    }

    @Input()
    public set ghost(ghost: boolean | string | undefined) {
        this.isGhost = forceBooleanFromInput(ghost);
    }

    @Input()
    public set danger(danger: boolean | string | undefined) {
        this.isDanger = forceBooleanFromInput(danger);
    }

    @Input()
    public set noOutline(noOutline: boolean | string | undefined) {
        this.isNotOutlined = forceBooleanFromInput(noOutline);
    }

    @Input()
    public set compact(compact: boolean | string | undefined) {
        this.isCompact = forceBooleanFromInput(compact);
    }

    @Input()
    public set tight(tight: boolean | string | undefined) {
        this.isTight = forceBooleanFromInput(tight);
    }

    @Input()
    public set circle(circle: boolean | string | undefined) {
        this.isCircle = forceBooleanFromInput(circle);
    }

    @Input()
    public set tabLike(tabLike: boolean | string | undefined) {
        this.isTabLike = forceBooleanFromInput(tabLike);
    }

    @Input()
    public set hideLabel(hideLabel: boolean | string | undefined) {
        this.shouldHideLabel = forceBooleanFromInput(hideLabel);
    }

    public get alignment(): 'left' | 'right' | 'center' {
        return this._alignment;
    }

    @Input()
    public set alignment(alignment: 'left' | 'right' | 'center') {
        this._alignment = alignment;

        switch (alignment) {
            case 'left':
                this._isLeftAligned = true;
                this._isCenterAligned = false;
                this._isRightAligned = false;
                break;
            case 'right':
                this._isLeftAligned = false;
                this._isCenterAligned = false;
                this._isRightAligned = true;
                break;
            default:
                this._isLeftAligned = false;
                this._isCenterAligned = true;
                this._isRightAligned = false;
        }
    }

    public focus(): void {
        this.button?.nativeElement?.focus();
    }
}

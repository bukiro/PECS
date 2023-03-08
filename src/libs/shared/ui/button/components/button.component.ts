import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {

    @Input()
    public label?: string;

    @Output()
    public readonly clicked = new EventEmitter<undefined>();

    @HostBinding('class.disabled')
    public isDisabled?: boolean;

    @HostBinding('class.processing')
    public isProcessing?: boolean;

    @HostBinding('class.toggled')
    public isToggled?: boolean;

    @HostBinding('class.ghost')
    public isGhost?: boolean;

    @HostBinding('class.no-outline')
    public isNotOutlined?: boolean;

    @HostBinding('class.compact')
    public isCompact?: boolean;

    @HostBinding('class.circle')
    public isCircle?: boolean;

    public shouldShowLabel?: boolean;

    @Input()
    public set disabled(disabled: boolean | string | undefined) {
        this.isDisabled = this._forceBoolean(disabled);
    }

    @Input()
    public set processing(processing: boolean | string | undefined) {
        this.isProcessing = this._forceBoolean(processing);
    }

    @Input()
    public set toggled(toggled: boolean | string | undefined) {
        this.isToggled = this._forceBoolean(toggled);
    }

    @Input()
    public set ghost(ghost: boolean | string | undefined) {
        this.isGhost = this._forceBoolean(ghost);
    }

    @Input()
    public set noOutline(noOutline: boolean | string | undefined) {
        this.isNotOutlined = this._forceBoolean(noOutline);
    }

    @Input()
    public set compact(compact: boolean | string | undefined) {
        this.isCompact = this._forceBoolean(compact);
    }

    @Input()
    public set circle(circle: boolean | string | undefined) {
        this.isCircle = this._forceBoolean(circle);
    }

    @Input()
    public set showLabel(showLabel: boolean | string | undefined) {
        this.shouldShowLabel = this._forceBoolean(showLabel);
    }

    private _forceBoolean(value: boolean | string | undefined): boolean {
        return value !== undefined && value !== false;
    }
}

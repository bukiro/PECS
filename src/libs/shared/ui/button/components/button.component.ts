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
    public isNotOutlined?: boolean | string;

    @HostBinding('class.rounded')
    public isRounded?: boolean | string;

    @Input()
    public set disabled(disabled: boolean | string | undefined) {
        this.isDisabled = disabled !== undefined && disabled !== false;
    }

    @Input()
    public set processing(processing: boolean | string | undefined) {
        this.isProcessing = processing !== undefined && processing !== false;
    }

    @Input()
    public set toggled(toggled: boolean | string | undefined) {
        this.isToggled = toggled !== undefined && toggled !== false;
    }

    @Input()
    public set ghost(ghost: boolean | string | undefined) {
        this.isGhost = ghost !== undefined && ghost !== false;
    }

    @Input()
    public set noOutline(noOutline: boolean | string | undefined) {
        this.isNotOutlined = noOutline !== undefined && noOutline !== false;
    }

    @Input()
    public set rounded(rounded: boolean | string | undefined) {
        this.isRounded = rounded !== undefined && rounded !== false;
    }
}

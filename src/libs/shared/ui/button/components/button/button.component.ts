import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { forceBooleanFromInput } from 'src/libs/shared/util/componentInputUtils';

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
    public set noOutline(noOutline: boolean | string | undefined) {
        this.isNotOutlined = forceBooleanFromInput(noOutline);
    }

    @Input()
    public set compact(compact: boolean | string | undefined) {
        this.isCompact = forceBooleanFromInput(compact);
    }

    @Input()
    public set circle(circle: boolean | string | undefined) {
        this.isCircle = forceBooleanFromInput(circle);
    }

    @Input()
    public set showLabel(showLabel: boolean | string | undefined) {
        this.shouldShowLabel = forceBooleanFromInput(showLabel);
    }
}

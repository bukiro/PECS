import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CornerButtonTrayComponent } from '../corner-button-tray/corner-button-tray.component';
import { ContentElementComponent } from '../../util/components/content-element/content-element.component';

@Component({
    selector: 'app-fly-in-menu',
    templateUrl: './fly-in-menu.component.html',
    styleUrl: './fly-in-menu.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        CornerButtonTrayComponent,
    ],
})
export class FlyInMenuComponent extends ContentElementComponent {

    @Input()
    @HostBinding('class.showing')
    public show = false;

    @Input()
    public showCloseButton = false;

    @Output()
    public readonly closeButtonClicked = new EventEmitter<undefined>();

    @HostBinding('class.left-bound')
    private _leftBound = false;

    @HostBinding('class.top-bound')
    private _topBound = false;

    @Input({ required: true })
    public set position(position: 'left' | 'top') {
        switch (position) {
            case 'left':
                this._leftBound = true;
                this._topBound = false;
                break;
            case 'top':
            default:
                this._leftBound = false;
                this._topBound = true;
        }
    }
}

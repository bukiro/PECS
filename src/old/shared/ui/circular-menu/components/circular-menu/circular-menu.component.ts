import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    QueryList,
    signal,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { ButtonComponent } from '../../../button/components/button/button.component';
import { CircularMenuOption } from '../../definitions/interfaces/circular-menu-option';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

const defaultDistanceRem = 5;

@Component({
    selector: 'app-circular-menu',
    templateUrl: './circular-menu.component.html',
    styleUrls: ['./circular-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbTooltip,

        ButtonComponent,
    ],
})
export class CircularMenuComponent extends TrackByMixin(ButtonComponent) {

    @ViewChild('centerButtonContainer')
    public centerButtonContainer?: ElementRef<HTMLDivElement>;

    @ViewChild('centerButton')
    public centerButton?: ButtonComponent;

    @ViewChildren('optionButton')
    public optionButtons?: QueryList<ButtonComponent>;

    @ViewChildren('optionButtonContainer')
    public optionButtonContainers?: QueryList<ElementRef<HTMLDivElement>>;

    /**
     * Radius of the circular menu in rem.
     */
    @Input()
    public radius = defaultDistanceRem;

    public showOptions$$ = signal<boolean>(false);

    private _options?: Array<CircularMenuOption>;

    @Input({ transform: booleanAttribute })
    public set disabled(disabled: boolean) {
        this.isDisabled = disabled;
    }

    @Input()
    public set options(options: Array<CircularMenuOption> | undefined) {
        this._options = this._prepareOptions(options);
    }

    public get options(): Array<CircularMenuOption> | undefined {
        return this._options;
    }

    @Input({ transform: booleanAttribute })
    public set hideLabel(hideLabel: boolean) {
        this.shouldHideLabel = hideLabel;
    }

    public toggleOptions(force?: boolean): void {
        this._updateCircleButtonPositions();

        this.showOptions$$.set(force !== undefined ? force : !this.showOptions$$());
    }

    public focusCenterButton(event: Event): void {
        this.centerButton?.focus();
        event.preventDefault();
    }

    public focusFirstButton(event: Event): void {
        this.optionButtons?.toArray()
            .shift()
            ?.focus();

        event.preventDefault();
    }

    private _updateCircleButtonPositions(): void {
        if (this.centerButtonContainer) {
            const half = .5;

            const centerButtonDimensions = this.centerButtonContainer.nativeElement.getBoundingClientRect();

            this.optionButtonContainers?.toArray().forEach((_ref, index) => {
                const optionButton = this.options?.[index];

                if (optionButton) {
                    const optionButtonDimensions = _ref.nativeElement.getBoundingClientRect();

                    optionButton.left =
                        centerButtonDimensions.x + (centerButtonDimensions.width * half) - (optionButtonDimensions.width * half);
                    optionButton.top =
                        centerButtonDimensions.y + (centerButtonDimensions.height * half) - (optionButtonDimensions.height * half);
                }

            });
        }
    }

    private _prepareOptions(options?: Array<CircularMenuOption>): Array<CircularMenuOption> | undefined {
        if (!options || !options.length) {
            return undefined;
        }

        const oldOptions = this.options;

        // If the number of options has not changed, transfer the left and top values to the each equivalent new option.
        // That way, the buttons don't wildly change position.
        // If the number has changed, assume that the buttons have changed, and close the menu.
        if (oldOptions?.length === options.length) {
            return options.map((option, index) => {
                const oldOption = oldOptions[index];

                return oldOption
                    ? {
                        ...option,
                        left: oldOption.left,
                        top: oldOption.top,
                        transform: oldOption.transform,
                    }
                    : { ...option };
            });
        } else {
            this.showOptions$$.set(false);
        }

        return options.map((option, index) => {
            const { x, y } = this._vectorFromAngle(index, options.length);

            return {
                ...option,
                transform: `translate(${ x }rem, ${ y }rem)`,
                translateY: y,
            };
        });
    }

    private _vectorFromAngle(optionIndex: number, totalOptions: number): { x: number; y: number } {
        if (!totalOptions) {
            return { x: 0, y: 0 };
        }

        const circle = 360;
        const halfCircle = 180;
        const quarterCircle = 90;
        const angle = circle / totalOptions * optionIndex;

        //Correct angle: 0deg should be on top, and the circle should be clockwise.
        const correctedAngle = (quarterCircle - angle) % circle;

        const radians = correctedAngle * Math.PI / halfCircle;

        const x = this.radius * Math.cos(radians);
        const y = -this.radius * Math.sin(radians);

        return { x, y };
    }
}

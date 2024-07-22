import { ChangeDetectionStrategy, Component, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { forceBooleanFromInput } from 'src/libs/shared/util/component-input-utils';
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

    @ViewChild('centerButton')
    public centerButton?: ElementRef<HTMLDivElement>;

    @ViewChildren('option')
    public optionButtons?: QueryList<ElementRef<HTMLDivElement>>;

    /**
     * Radius of the circular menu in rem.
     */
    @Input()
    public radius = defaultDistanceRem;

    public showOptions = false;

    private _options?: Array<CircularMenuOption>;

    @Input()
    public set disabled(disabled: boolean | string | undefined) {
        this.isDisabled = forceBooleanFromInput(disabled);
    }

    @Input()
    public set options(options: Array<CircularMenuOption> | undefined) {
        this._options = this._prepareOptions(options);
    }

    public get options(): Array<CircularMenuOption> | undefined {
        return this._options;
    }

    @Input()
    public set hideLabel(hideLabel: boolean | string | undefined) {
        this.shouldHideLabel = forceBooleanFromInput(hideLabel);
    }

    public toggleOptions(): void {
        this._updatePaletteButtonPositions();

        this.showOptions = !this.showOptions;
    }

    private _updatePaletteButtonPositions(): void {
        if (this.centerButton) {
            const half = .5;

            const centerButtonDimensions = this.centerButton.nativeElement.getBoundingClientRect();

            this.optionButtons?.toArray().forEach((_ref, index) => {
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

        // If the number of options has not changed, transfer the left and top values to the each equivalent new option.
        // That way, the buttons don't wildly change position.
        // If the number has changed, assume that the buttons have changed, and close the menu.
        if (this.options && this.options.length === options.length) {
            return options.map((option, index) => ({
                ...option,
                left: this.options?.[index].left,
                top: this.options?.[index].top,
                transform: this.options?.[index].transform,
            }));
        } else {
            this.showOptions = false;
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

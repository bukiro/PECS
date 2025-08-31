import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, input, computed, Signal } from '@angular/core';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { safeParseInt, stringEqualsCaseInsensitive } from '../../util/utils/string-utils';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-value-effects-buttons',
    templateUrl: './value-effects-buttons.component.html',
    styleUrls: ['./value-effects-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbPopover,
        NgbTooltip,
        ButtonComponent,
        //ObjectEffectsComponent,
    ],
})
export class ValueEffectsButtonsComponent {
    @Input({ required: true })
    public title?: string;

    @Output()
    public readonly showNotesChange = new EventEmitter<boolean>();

    public readonly target = input.required<string>();

    public readonly creature = input.required<Creature>();

    public readonly quickValue$$: Signal<number>;
    public readonly quickEffect$$: Signal<EffectGain | undefined>;

    constructor() {
        this.quickEffect$$ = computed(() => {
            const effects = this.creature().effects();
            const target = this.target();

            return this._getQuickEffect(effects, target);
        });

        this.quickValue$$ = computed(() => safeParseInt(this.quickEffect$$()?.value(), 0));
    }

    public changeQuickValue(change: 1 | -1): void {
        this._setQuickValue(this.quickValue$$() + change);
    }

    private _setQuickValue(change: number): void {
        const effects = this.creature().effects;
        const target = this.target();
        const quickEffect = this._getQuickEffect(effects(), target);

        if (change === 0) {
            if (quickEffect) {
                effects.update(value => value.filter(effect => effect !== quickEffect));
            }
        } else {
            if (quickEffect) {
                quickEffect.value.set(String(change));
            } else {
                effects.update(value =>
                    [
                        ...value,
                        EffectGain.from({
                            affected: target,
                            value: String(change),
                            source: 'Quick buttons',
                            quickEffect: true,
                        }),
                    ],
                );
            }
        }
    }

    private _getQuickEffect(effects: Array<EffectGain>, target: string): EffectGain | undefined {
        return effects
            ?.find(effect =>
                stringEqualsCaseInsensitive(effect.affected, target)
                && effect.quickEffect,
            );
    }
}

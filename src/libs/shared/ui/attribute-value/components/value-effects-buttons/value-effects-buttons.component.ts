import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, input } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { CommonModule } from '@angular/common';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from '../../../button/components/button/button.component';
import { combineLatest, map, Observable, shareReplay, switchMap, take } from 'rxjs';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { toObservable } from '@angular/core/rxjs-interop';
import { ObjectEffectsComponent } from 'src/libs/shared/object-effects/components/object-effects/object-effects.component';

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
        ObjectEffectsComponent,
    ],
})
export class ValueEffectsButtonsComponent {
    @Input({ required: true })
    public title?: string;

    @Output()
    public readonly showNotesChange = new EventEmitter<boolean>();

    public target = input.required<string>();

    public creature = input.required<Creature>();

    public readonly quickValue$: Observable<number>;
    public readonly quickEffect$: Observable<EffectGain | undefined>;

    constructor() {
        this.quickEffect$ =
            combineLatest([
                toObservable(this.creature)
                    .pipe(
                        switchMap(creature => creature.effects.values$),
                    ),
                toObservable(this.target),
            ])
                .pipe(
                    map(([effects, target]) =>
                        this._getQuickEffect(effects, target),
                    ),
                    shareReplay({ refCount: true, bufferSize: 1 }),
                );

        this.quickValue$ =
            this.quickEffect$
                .pipe(
                    map(effect => parseInt(effect?.value ?? '0', 10) ?? 0),
                    shareReplay({ refCount: true, bufferSize: 1 }),
                );
    }

    public changeQuickValue(change: 1 | -1): void {
        this.quickValue$
            .pipe(take(1))
            .subscribe(quickValue => this._setQuickValue(quickValue + change));
    }

    private _setQuickValue(change: number): void {
        const effects = this.creature().effects;
        const target = this.target();
        const quickEffect = this._getQuickEffect(effects, target);

        if (change === 0) {
            if (quickEffect) {
                this.creature().effects = effects.filter(effect => effect !== quickEffect);
            }
        } else {
            if (quickEffect) {
                quickEffect.value = String(change);
                effects?.triggerOnChange();
            } else {
                effects.push(EffectGain.from({
                    affected: target,
                    value: String(change),
                    source: 'Quick buttons',
                    quickEffect: true,
                }));
            }
        }
    }

    private _getQuickEffect(effects: Array<EffectGain>, target: string): EffectGain | undefined {
        return effects
            ?.find(effect =>
                effect.affected.toLowerCase() === target.toLowerCase()
                && effect.quickEffect,
            );
    }
}

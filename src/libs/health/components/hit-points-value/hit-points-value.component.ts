import { Component, ChangeDetectionStrategy, input, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrettyValueComponent } from 'src/libs/shared/ui/attribute-value/components/pretty-value/pretty-value.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { TemporaryHP } from 'src/app/classes/creatures/temporary-hp';
import { SystemColors } from 'src/libs/shared/definitions/system-colors';

interface Value {
    result: number;
    bonuses: Array<BonusDescription>;
}

@Component({
    selector: 'app-hit-points-value',
    templateUrl: './hit-points-value.component.html',
    styleUrls: ['./hit-points-value.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        PrettyValueComponent,
    ],
})
export class HitPointsValueComponent {
    public currentHP$$ = input.required<Value>({ alias: 'currentHP' });
    public maxHP$$ = input.required<Value>({ alias: 'maxHP' });
    public temporaryHP$$ = input<TemporaryHP | undefined>(undefined, { alias: 'temporaryHP' });

    // TODO: temporaryHP$$().amount must be reactive.
    public totalMaxHP$$ = computed(() =>
        this.maxHP$$().result + (this.temporaryHP$$()?.amount ?? 0),
    );

    // Create an ad-hoc BonusDescription for the temporary HP's tooltip.
    public temporaryHPBonuses$$: Signal<Array<BonusDescription>> = computed(() => {
        const temporaryHP = this.temporaryHP$$();

        return [{
            value: String(temporaryHP?.amount),
            title: temporaryHP?.source ?? '',
        }];
    });

    public highlight$$: Signal<SystemColors> = computed(() => {
        const dangerThreshold = .3;

        const percentage = this._hpPercentage$$();

        if (percentage < dangerThreshold) {
            return SystemColors.Penalty;
        } else if (percentage === 1) {
            return SystemColors.Bonus;
        } else {
            return SystemColors.Warning;
        }
    });

    public highlightStrength$$: Signal<number> = computed(() => {
        const dangerThreshold = .3;
        const baseStrength = .25;

        const percentage = this._hpPercentage$$();

        if (percentage < dangerThreshold) {
            return 1 - (percentage / dangerThreshold * (1 - baseStrength));
        } else {
            return baseStrength;
        }
    });

    private readonly _hpPercentage$$: Signal<number> = computed(() => this.currentHP$$().result / this.totalMaxHP$$());
}

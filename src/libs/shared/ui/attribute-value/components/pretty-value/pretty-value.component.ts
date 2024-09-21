import { Component, ChangeDetectionStrategy, input, booleanAttribute, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { forceBooleanFromInput } from 'src/libs/shared/util/component-input-utils';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { BonusListComponent } from 'src/libs/shared/ui/bonus-list/components/bonus-list/bonus-list.component';
import { HasPenaltiesPipe } from '../../pipes/has-penalties.pipe';
import { HasAbsolutesPipe } from '../../pipes/has-absolutes.pipe';
import { HasBonusesPipe } from '../../pipes/has-bonuses.pipe';


@Component({
    selector: 'app-pretty-value',
    templateUrl: './pretty-value.component.html',
    styleUrls: ['./pretty-value.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        NgbPopoverModule,
        BonusListComponent,
        HasAbsolutesPipe,
        HasBonusesPipe,
        HasPenaltiesPipe,
    ],
})
export class PrettyValueComponent {
    public readonly value$$ = input<number | string | undefined>(undefined, { alias: 'value' });

    public readonly clickLabel$$ = input<string | undefined>(undefined, { alias: 'clickLabel' });

    public readonly forceAbsolute$$ = input<boolean, unknown>(
        false,
        { alias: 'forceAbsolute', transform: booleanAttribute },
    );
    public readonly forceBonus$$ = input<boolean, unknown>(
        false,
        { alias: 'forceBonus', transform: booleanAttribute },
    );
    public readonly forcePenalty$$ = input<boolean, unknown>(
        false,
        { alias: 'forcePenalty', transform: booleanAttribute },
    );

    public readonly bonuses$$ = input<Array<BonusDescription>, Array<BonusDescription> | undefined>(
        [],
        { alias: 'bonuses', transform: value => value ?? [] },
    );

    public readonly opaque$$ = input<boolean, boolean | string | number>(
        false,
        { alias: 'opaque', transform: value => forceBooleanFromInput(value) },
    );

    public readonly isAbsolute$$ = computed(() => {
        if (this.forceAbsolute$$()) {
            return true;
        }

        if (this.forcePenalty$$() || this.forceBonus$$()) {
            return false;
        }

        return this._hasAbsolutes$$();
    });

    public readonly isPenalty$$ = computed(() => {
        if (this.forceAbsolute$$()) {
            return false;
        }

        if (this.forcePenalty$$()) {
            return true;
        }

        if (this.forceBonus$$()) {
            return false;
        }

        return !this._hasAbsolutes$$()
            && this._hasPenalties$$();
    });

    public readonly isBonus$$ = computed(() => {
        if (this.forceAbsolute$$() || this.forcePenalty$$()) {
            return false;
        }

        if (this.forceBonus$$()) {
            return true;
        }

        return !this._hasAbsolutes$$()
            && !this._hasPenalties$$()
            && this._hasBonuses$$();
    });

    private readonly _hasAbsolutes$$ = computed(() => !!this.bonuses$$()?.some(bonus => bonus.isAbsolute));
    private readonly _hasBonuses$$ = computed(() => !!this.bonuses$$()?.some(bonus => bonus.isBonus));
    private readonly _hasPenalties$$ = computed(() => !!this.bonuses$$()?.some(bonus => bonus.isPenalty));
}

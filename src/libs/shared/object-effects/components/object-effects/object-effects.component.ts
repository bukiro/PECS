import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { BonusTypes } from 'src/libs/shared/definitions/bonus-types';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface EffectValueParameters {
    displayType?: 'Formula' | 'Toggle' | 'Value';
    isFormula: boolean;
    formulaValue: string | null;
}

@Component({
    selector: 'app-object-effects',
    templateUrl: './object-effects.component.html',
    styleUrls: ['./object-effects.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbPopover,
    ],
})
export class ObjectEffectsComponent extends TrackByMixin(BaseClass) {

    @Input()
    public objectName = '';
    @Input()
    public creature: Creature = CreatureService.character;

    constructor(
        private readonly _evaluationService: EvaluationService,
    ) {
        super();
    }

    public validate(effect: EffectGain): void {
        if (this._isFormula(effect.value)) {
            effect.value = '0';
        }
    }

    public customEffectsOnThis(): Array<EffectGain> {
        return this.creature.effects.filter(effect => effect.affected.toLowerCase() === this.objectName.toLowerCase());
    }

    public bonusTypes(): Array<string> {
        return Object.values(BonusTypes).map(type => type === BonusTypes.Untyped ? '' : type);
    }

    public newCustomEffectOnThis(): void {
        this.creature.effects.push(EffectGain.from({ affected: this.objectName }));
    }

    public removeCustomEffect(effect: EffectGain): void {
        this.creature.effects.splice(this.creature.effects.indexOf(effect), 1);
    }

    public effectValueParameters(effect: EffectGain): EffectValueParameters {
        const isFormula = this._isFormula(effect.setValue ? effect.setValue : effect.value);
        const formulaValue = isFormula ? this._formulaValue(effect) : null;
        const displayType = this._effectDisplayType(effect, isFormula);

        return {
            displayType,
            isFormula,
            formulaValue,
        };
    }

    private _effectDisplayType(effect: EffectGain, isFormula: boolean): 'Formula' | 'Toggle' | 'Value' | undefined {
        if (effect.setValue || (effect.value && isFormula)) {
            return 'Formula';
        }

        if (effect.toggle) {
            return 'Toggle';
        }

        if (!effect.setValue && !isFormula) {
            return 'Value';
        }
    }

    private _formulaValue(effect: EffectGain): string {
        //Send the effect's setValue or value to the EvaluationService to get its result.
        const value = effect.setValue || effect.value || null;

        if (value) {
            const result =
                this._evaluationService.valueFromFormula$(
                    value,
                    { creature: this.creature, effect },
                );

            if (result) {
                return `= ${ result }`;
            }
        }

        //If the EffectGain did not produce a value, return a zero value instead.
        return '0';
    }

    private _isFormula(value: string): boolean {
        if (isNaN(parseInt(value, 10))) {
            if (!value.match('^[0-9-]*$')?.length) {
                return true;
            }
        }

        return false;
    }

}

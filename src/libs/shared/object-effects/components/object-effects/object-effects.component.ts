import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { EffectGain } from 'src/app/classes/EffectGain';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature } from 'src/app/classes/Creature';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

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
})
export class ObjectEffectsComponent extends TrackByMixin(BaseClass) {

    @Input()
    public objectName = '';
    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _evaluationService: EvaluationService,
    ) {
        super();
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public validate(effect: EffectGain): void {
        if (this._isFormula(effect.value)) {
            effect.value = '0';
        }

        this.updateEffects();
    }

    public customEffectsOnThis(): Array<EffectGain> {
        return this._currentCreature.effects.filter(effect => effect.affected.toLowerCase() === this.objectName.toLowerCase());
    }

    public bonusTypes(): Array<string> {
        return Object.values(BonusTypes).map(type => type === BonusTypes.Untyped ? '' : type);
    }

    public newCustomEffectOnThis(): void {
        this._currentCreature.effects.push(Object.assign(new EffectGain(), { affected: this.objectName }));
    }

    public removeCustomEffect(effect: EffectGain): void {
        this._currentCreature.effects.splice(this._currentCreature.effects.indexOf(effect), 1);
        this.updateEffects();
    }

    public updateEffects(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
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
                this._evaluationService.valueFromFormula(
                    value,
                    { creature: this._currentCreature, effect },
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

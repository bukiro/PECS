import { Component, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { EffectGain } from 'src/app/classes/EffectGain';
import { EffectsService } from 'src/app/services/effects.service';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { InputValidationService } from 'src/app/services/inputValidation.service';

@Component({
    selector: 'app-objectEffects',
    templateUrl: './objectEffects.component.html',
    styleUrls: ['./objectEffects.component.css']
})
export class ObjectEffectsComponent {

    @Input()
    objectName: string = "";
    @Input()
    creature: string = "";

    constructor(
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private effectsService: EffectsService,
        private evaluationService: EvaluationService
    ) { }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    validate(effect: EffectGain) {
        if (this.get_IsFormula(effect.value)) {
            effect.value = "0";
        }
        this.update_Effects();
    }

    get_CustomEffectsOnThis() {
        return this.get_Creature().effects.filter(effect => effect.affected.toLowerCase() == this.objectName.toLowerCase())
    }

    get_BonusTypes() {
        return this.effectsService.bonusTypes.map(type => type == "untyped" ? "" : type);
    }

    new_CustomEffectOnThis() {
        this.get_Creature().effects.push(Object.assign(new EffectGain(), { affected: this.objectName }));
    }

    remove_CustomEffect(effect: EffectGain) {
        this.get_Creature().effects.splice(this.get_Creature().effects.indexOf(effect), 1);
        this.update_Effects();
    }

    update_Effects() {
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
    }

    get_IsFormula(value: string) {
        if (isNaN(parseInt(value))) {
            if (!value.match("^[0-9-]*$").length) {
                return true;
            }
        }
        return false;
    }

    get_EffectValue(effect: EffectGain) {
        //Send the effect's setValue or value to the EvaluationService to get its result.
        let value = effect.setValue || effect.value || null;
        if (value) {
            let result = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Creature(), effect: effect });
            if (result) {
                return "= " + result;
            }
        }
        //If the EffectGain did not produce a value, return a zero value instead.
        return "0";
    }

}

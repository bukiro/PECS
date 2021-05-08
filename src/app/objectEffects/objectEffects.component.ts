import { ThrowStmt } from '@angular/compiler';
import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { Effect } from '../Effect';
import { EffectGain } from '../EffectGain';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-objectEffects',
    templateUrl: './objectEffects.component.html',
    styleUrls: ['./objectEffects.component.css']
})
export class ObjectEffectsComponent implements OnInit {

    @Input()
    objectName: string = "";
    @Input()
    creature: string = "";

    constructor(
        private characterService: CharacterService,
        private effectsService: EffectsService
    ) { }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
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
        return this.effectsService.get_BonusTypes().map(type => type == "untyped" ? "" : type);
    }

    new_CustomEffectOnThis() {
        this.get_Creature().effects.push(Object.assign(new EffectGain(), { affected: this.objectName }));
    }

    remove_CustomEffect(effect: EffectGain) {
        this.get_Creature().effects.splice(this.get_Creature().effects.indexOf(effect), 1);
        this.update_Effects();
    }

    update_Effects() {
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    get_IsFormula(value: string) {
        return isNaN(parseInt(value));
    }

    get_EffectValue(effect: EffectGain) {
        //Fit the custom effect into the box defined by get_SimpleEffects
        let effectsObject = { effects: [effect] }
        let result = this.effectsService.get_SimpleEffects(this.get_Creature(), this.characterService, effectsObject);
        if (result.length) {
            if (result[0].setValue) {
                return "= " + result[0].setValue;
            }
            if (result[0].value) {
                return result[0].value;
            }
        } else {
            //If the EffectGain did not produce an effect, return a blank effect instead.
            return "0";
        }
    }

    ngOnInit() {
    }

}

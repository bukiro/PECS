import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { Item } from './Item';
import { OtherItem } from './OtherItem';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';

export class Bulk {
    public $bonus: Effect[];
    public $current: {value:number, desc:string} = {value:0, desc:""};
    public $effects: Effect[];
    public $encumbered: {value:number, desc:string} = {value:0, desc:""};
    public $limit: {value:number, desc:string} = {value:0, desc:""};
    public $max: {value:number, desc:string} = {value:0, desc:""};
    public $penalty: Effect[];
    calculate(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        this.$effects = this.effects(creature, effectsService);
        this.$bonus = this.bonus(creature, effectsService);
        this.$penalty = this.penalty(creature, effectsService);
        this.$current = this.current(creature, characterService, effectsService);
        this.$limit = this.limit(creature, characterService, effectsService);
        this.$encumbered = this.encumbered();
        this.$max = this.max();
    }
    effects(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(creature, "Max Bulk");
    }
    bonus(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(creature, "Max Bulk");
    }
    penalty(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(creature, "Max Bulk");
    }
    current(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
        let sum: number = 0;
        let explain: string = "";
        let inventories = creature.inventories;
        inventories.forEach(inventory => {
            //To avoid decimal issues, the bulk is rounded to one decimal.
            let bulk = Math.floor(Math.max(inventory.get_Bulk(false) - inventory.bulkReduction, 0) * 10) / 10;
            sum += bulk;
            explain += "\n"+inventory.get_Name(characterService)+": "+bulk;
        })
        let effects = effectsService.get_EffectsOnThis(creature, "Bulk");
        effects.forEach(effect => {
            sum += parseInt(effect.value);
        });
        sum = Math.max(0, sum);
        //Cut the first newline
        explain = explain.trim();
        return {value:Math.floor(sum), desc:explain};
    }
    limit(creature: Character|AnimalCompanion, characterService: CharacterService, effectsService: EffectsService) {
    //Gets the basic bulk and adds all effects
        if (characterService.still_loading()) { return this.$limit; }
        let result: {value:number, desc:string} = {value:0, desc:""};
        let str = characterService.get_Abilities("Strength")[0].mod(creature, characterService, effectsService);
        if (str != 0) {
            result.value += str;
            result.desc += "\nStrength Modifier: "+str;
        }
        this.$effects.forEach(effect => {
            result.value += parseInt(effect.value);
            result.desc += "\n"+effect.source+": "+effect.value;
        });
        return result;
    }
    encumbered() {
        let result: {value:number, desc:string} = {value:5, desc:"Base limit: 5"};
        result.value += this.$limit.value;
        result.desc += this.$limit.desc;
        return result;
    }
    max() {
        let result: {value:number, desc:string} = {value:10, desc:"Base limit: 10"};
        result.value += this.$limit.value;
        result.desc += this.$limit.desc;
        return result;
    }
}
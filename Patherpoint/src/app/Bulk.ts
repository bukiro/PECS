import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { Item } from './Item';

export class Bulk {
    public $effects: Effect[];
    public $bonus: Effect[];
    public $penalty: Effect[];
    public $current: number = 0;
    public $limit: {value:number, desc:string} = {value:0, desc:""};
    public $encumbered: {value:number, desc:string} = {value:0, desc:""};
    public $max: {value:number, desc:string} = {value:0, desc:""};
    calculate(characterService: CharacterService, effectsService: EffectsService) {
        this.$effects = this.effects(effectsService);
        this.$bonus = this.bonus(effectsService);
        this.$penalty = this.penalty(effectsService);
        this.$current = this.current(characterService, effectsService);
        this.$limit = this.limit(characterService, effectsService);
        this.$encumbered = this.encumbered();
        this.$max = this.max();
    }
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis("Max Bulk");
    }
    bonus(effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis("Max Bulk");
    }
    penalty(effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis("Max Bulk");
    }
    current(characterService: CharacterService, effectsService: EffectsService) {
        let sum: number = 0;
        let inventory = characterService.get_InventoryItems();
        function addup(item: Item) {
            let bulk = item.bulk;
            if (item["carryingBulk"] && !item["equipped"]) {
                bulk = item["carryingBulk"];
            }
            switch (bulk) {
                case "":
                    break;
                case "-":
                    break;
                case "L":
                    if (item.amount) {
                        sum += 0.1 * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1)) ;
                    } else {
                        sum += 0.1;
                    }
                    break;
                default:
                    if (item.amount) {
                        sum += parseInt(bulk) * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1));
                    } else {
                        sum += parseInt(bulk);
                    }
                    break;
            }
        }
        inventory.allEquipment().forEach(item => {
            addup(item);
        })
        inventory.allConsumables().forEach(item => {
            addup(item);
        })
        let effects = effectsService.get_EffectsOnThis("Bulk");
        effects.forEach(effect => {
            sum += parseInt(effect.value);
        });
        sum = Math.max(0, sum);
        return Math.floor(sum);
    }
    limit(characterService: CharacterService, effectsService: EffectsService) {
    //Gets the basic bulk and adds all effects
        if (characterService.still_loading()) { return this.$limit; }
        let result: {value:number, desc:string} = {value:0, desc:""};
        let str = characterService.get_Abilities("Strength")[0].mod(characterService, effectsService);
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
import { Creature } from './Creature';
import { EffectsService } from './effects.service';
import { FeatChoice } from './FeatChoice';

export class Familiar extends Creature {
    public readonly _className: string = this.constructor.name;
    public abilities: FeatChoice[] = [];
    public species: string = "";
    public readonly type = "Companion";
    get_Size(effectsService: EffectsService) {
        let size: number = (-2);
        
        let sizeEffects = effectsService.get_Effects().all.filter(effect => effect.creature == this.id && effect.apply && effect.target == "Size");
        sizeEffects.forEach(effect => {
            size += parseInt(effect.value)
        })

        switch (size) {
            case -2:
                return "Tiny";
            case -1:
                return "Small";
            case 0:
                return "Medium"
            case 1:
                return "Large"
            case 2:
                return "Huge"
            case 3:
                return "Gargantuan"
        }
    }
}

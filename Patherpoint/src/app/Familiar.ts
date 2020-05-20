import { Creature } from './Creature';
import { EffectsService } from './effects.service';
import { FeatChoice } from './FeatChoice';
import { Skill } from './Skill';

export class Familiar extends Creature {
    public readonly _className: string = this.constructor.name;
    public readonly type = "Familiar";
    public abilities: FeatChoice = Object.assign(new FeatChoice, {
        available: 2,
        id: "0-Feat-Familiar-0",
        source: "Familiar",
        type: "Familiar"
    });
    public customSkills: Skill[] = [
        Object.assign(new Skill(), { name:"Attack Rolls", type:"Familiar Proficiency" })
    ];
    public originClass: string = "";
    public senses: string[] = ["Low-light Vision"];
    public species: string = "";
    public traits: string[] = ["Minion"];
    get_Size(effectsService: EffectsService) {
        let size: number = (-2);
        
        let setSizeEffects = effectsService.get_Effects().all.filter(effect => effect.creature == this.id && effect.apply && effect.target == "Size" && effect.setValue);
        if (setSizeEffects.length) {
            size = Math.max(...setSizeEffects.map(effect => parseInt(effect.setValue)));
        }
        
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

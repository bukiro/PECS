import { Creature } from './Creature';
import { EffectsService } from './effects.service';
import { FeatChoice } from './FeatChoice';
import { FeatTaken } from './FeatTaken';
import { ItemsService } from './items.service';
import { Skill } from './Skill';
import { TypeService } from './type.service';

export class Familiar extends Creature {
        public readonly type = "Familiar";
    public abilities: FeatChoice = Object.assign(new FeatChoice, {
        available: 2,
        id: "0-Feat-Familiar-0",
        source: "Familiar",
        type: "Familiar"
    });
    public customSkills: Skill[] = [
        Object.assign(new Skill(), { name: "Attack Rolls", type: "Familiar Proficiency" })
    ];
    public originClass: string = "";
    public senses: string[] = ["Low-Light Vision"];
    public species: string = "";
    public traits: string[] = ["Minion"];
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.abilities = Object.assign(new FeatChoice(), this.abilities).recast();
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        return this;
    }
    get_BaseSize() {
        return -2;
    }
    get_Size(effectsService: EffectsService) {
        let size: number = this.get_BaseSize();

        let setSizeEffects = effectsService.get_AbsolutesOnThis(this, "Size");
        if (setSizeEffects.length) {
            size = Math.max(...setSizeEffects.map(effect => parseInt(effect.setValue)));
        }

        let sizeEffects = effectsService.get_RelativesOnThis(this, "Size");
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
    get_FeatsTaken(featName: string = "") {
        let featsTaken: string[] = [];
        this.abilities.feats.filter((feat: FeatTaken) => feat.name.toLowerCase() == featName.toLowerCase() || featName == "")
            .forEach(feat => {
                featsTaken.push(feat.name);
            })
        return featsTaken;
    }
}

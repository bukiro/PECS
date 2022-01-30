import { CharacterService } from 'src/app/services/character.service';
import { Creature } from './Creature';
import { Feat } from 'src/app/classes/Feat';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { FeatTaken } from 'src/app/classes/FeatTaken';
import { Hint } from 'src/app/classes/Hint';
import { ItemsService } from 'src/app/services/items.service';
import { Skill } from 'src/app/classes/Skill';
import { TypeService } from 'src/app/services/type.service';

export class Familiar extends Creature {
    public readonly type = "Familiar";
    public readonly typeId = 2;
    public abilities: FeatChoice = Object.assign(new FeatChoice, {
        available: 2,
        id: "0-Feat-Familiar-0",
        source: "Familiar",
        type: "Familiar"
    });
    public customSkills: Skill[] = [
        new Skill("", "Attack Rolls", "Familiar Proficiency")
    ];
    public originClass: string = "";
    public senses: string[] = ["Low-Light Vision"];
    public species: string = "";
    public traits: string[] = ["Minion"];
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.abilities = Object.assign(new FeatChoice(), this.abilities).recast();
        return this;
    }
    get_BaseSize() {
        return -2;
    }
    get_FeatsTaken(featName: string = "") {
        let featsTaken: string[] = [];
        this.abilities.feats.filter((feat: FeatTaken) => feat.name.toLowerCase() == featName.toLowerCase() || featName == "")
            .forEach(feat => {
                featsTaken.push(feat.name);
            })
        return featsTaken;
    }
    get_EffectsGenerationObjects(characterService: CharacterService) {
        //Return the Familiar, its Feats and their hints for effect generation.
        let feats: Feat[] = [];
        let hintSets: { hint: Hint, objectName: string }[] = [];
        characterService.familiarsService.get_FamiliarAbilities().filter(ability => ability.have(this, characterService))
            .filter(ability => ability.effects?.length || ability.hints?.length)
            .forEach(ability => {
                feats.push(ability);
                ability.hints?.forEach(hint => {
                    hintSets.push({ hint: hint, objectName: ability.name });
                })
            });
        return { feats: feats, hintSets: hintSets };
    }
}

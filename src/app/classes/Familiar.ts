import { CharacterService } from 'src/app/services/character.service';
import { Creature } from './Creature';
import { Feat } from 'src/app/classes/Feat';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { FeatTaken } from 'src/app/classes/FeatTaken';
import { Hint } from 'src/app/classes/Hint';
import { ItemsService } from 'src/app/services/items.service';
import { Skill } from 'src/app/classes/Skill';
import { TypeService } from 'src/app/services/type.service';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';

export class Familiar extends Creature {
    public readonly type = 'Familiar';
    public readonly typeId = 2;
    public abilities: FeatChoice = Object.assign(new FeatChoice, {
        available: 2,
        id: '0-Feat-Familiar-0',
        source: 'Familiar',
        type: 'Familiar'
    });
    public customSkills: Skill[] = [
        new Skill('', 'Attack Rolls', 'Familiar Proficiency')
    ];
    public originClass = '';
    public senses: string[] = ['Low-Light Vision'];
    public species = '';
    public traits: string[] = ['Minion'];
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.abilities = Object.assign(new FeatChoice(), this.abilities).recast();
        return this;
    }
    get_BaseSize() {
        return -2;
    }
    get_BaseHP(services: { characterService: CharacterService }): { result: number, explain: string } {
        let explain = '';
        let classHP = 0;
        const charLevel = services.characterService.get_Character().level;
        //Your familiar has 5 Hit Points for each of your levels.
        classHP = 5 * charLevel;
        explain = `Familiar base HP: ${ classHP }`;
        return { result: classHP, explain: explain.trim() };
    }
    get_BaseSpeed(speedName: string): { result: number, explain: string } {
        let explain = '';
        let sum = 0;
        if (speedName == this.speeds[1].name) {
            sum = 25;
            explain = `\nBase speed: ${ sum }`;
        }
        return { result: sum, explain: explain.trim() };
    }
    get_FeatsTaken(featName = '') {
        const featsTaken: string[] = [];
        this.abilities.feats.filter((feat: FeatTaken) => feat.name.toLowerCase() == featName.toLowerCase() || featName == '')
            .forEach(feat => {
                featsTaken.push(feat.name);
            });
        return featsTaken;
    }
    get_EffectsGenerationObjects(characterService: CharacterService): { feats: (Feat | AnimalCompanionSpecialization)[], hintSets: { hint: Hint, objectName: string }[] } {
        //Return the Familiar, its Feats and their hints for effect generation.
        const feats: Feat[] = [];
        const hintSets: { hint: Hint, objectName: string }[] = [];
        characterService.familiarsService.get_FamiliarAbilities().filter(ability => ability.have(this, characterService))
            .filter(ability => ability.effects?.length || ability.hints?.length)
            .forEach(ability => {
                feats.push(ability);
                ability.hints?.forEach(hint => {
                    hintSets.push({ hint, objectName: ability.name });
                });
            });
        return { feats, hintSets };
    }
}

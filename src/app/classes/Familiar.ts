import { CharacterService } from 'src/app/services/character.service';
import { Creature, CreatureEffectsGenerationObjects } from './Creature';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Hint } from 'src/app/classes/Hint';
import { ItemsService } from 'src/app/services/items.service';
import { Skill } from 'src/app/classes/Skill';
import { TypeService } from 'src/app/services/type.service';
import { Defaults } from '../../libs/shared/definitions/defaults';
import { CreatureSizes } from '../../libs/shared/definitions/creatureSizes';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

export class Familiar extends Creature {
    public readonly type = CreatureTypes.Familiar;
    public readonly typeId = 2;
    public abilities: FeatChoice = Object.assign(new FeatChoice(), {
        available: Defaults.familiarAbilities,
        id: '0-Feat-Familiar-0',
        source: 'Familiar',
        type: 'Familiar',
    });
    public customSkills: Array<Skill> = [
        new Skill('', 'Attack Rolls', 'Familiar Proficiency'),
    ];
    public originClass = '';
    public senses: Array<string> = ['Low-Light Vision'];
    public species = '';
    public traits: Array<string> = ['Minion'];
    public recast(itemsService: ItemsService): Familiar {
        super.recast(itemsService);
        this.abilities = Object.assign(new FeatChoice(), this.abilities).recast();

        return this;
    }
    public baseSize(): number {
        return CreatureSizes.Tiny;
    }
    public baseHP(services: { characterService: CharacterService }): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
        const charLevel = services.characterService.character.level;
        const familiarHPMultiplier = 5;

        //Your familiar has 5 Hit Points for each of your levels.
        classHP = familiarHPMultiplier * charLevel;
        explain = `Familiar base HP: ${ classHP }`;

        return { result: classHP, explain: explain.trim() };
    }
    public baseSpeed(speedName: string): { result: number; explain: string } {
        let explain = '';
        let sum = 0;

        if (speedName === this.speeds[1].name) {
            sum = Defaults.defaultFamiliarSpeed;
            explain = `\nBase speed: ${ sum }`;
        }

        return { result: sum, explain: explain.trim() };
    }
    public effectsGenerationObjects(
        characterService: CharacterService): CreatureEffectsGenerationObjects {
        //Return the Familiar, its Feats and their hints for effect generation.
        const feats: Array<Feat> = [];
        const hintSets: Array<{ hint: Hint; objectName: string }> = [];

        characterService.familiarsService.familiarAbilities().filter(ability => ability.have({ creature: this }, { characterService }))
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

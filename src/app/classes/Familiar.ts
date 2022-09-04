import { Creature } from './Creature';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Skill } from 'src/app/classes/Skill';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CreatureSizes } from 'src/libs/shared/definitions/creatureSizes';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityBoost } from './AbilityBoost';
import { SkillIncrease } from './SkillIncrease';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

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
    public get requiresConForHP(): boolean { return false; }

    public recast(recastFns: RecastFns): Familiar {
        super.recast(recastFns);
        this.abilities = Object.assign(new FeatChoice(), this.abilities).recast();

        return this;
    }

    public clone(recastFns: RecastFns): Familiar {
        return Object.assign<Familiar, Familiar>(new Familiar(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public isFamiliar(): this is Familiar {
        return true;
    }

    public baseSize(): number {
        return CreatureSizes.Tiny;
    }

    //Other implementations require conModifier.
    public baseHP(charLevel: number): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
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

    public abilityBoosts(): Array<AbilityBoost> { return []; }

    public skillIncreases(): Array<SkillIncrease> { return []; }
}

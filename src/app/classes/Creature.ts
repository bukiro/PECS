import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Health } from 'src/app/classes/Health';
import { Speed } from 'src/app/classes/Speed';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Skill } from 'src/app/classes/Skill';
import { Effect } from 'src/app/classes/Effect';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';
import { AbilityBoost } from './AbilityBoost';
import { SkillIncrease } from './SkillIncrease';
import { Item } from './Item';

export interface SkillNotes {
    name: string;
    showNotes: boolean;
    notes: string;
}

export abstract class Creature {
    public name = '';
    public alignment = 'Neutral';
    public id = uuidv4();
    public type: CreatureTypes = CreatureTypes.Character;
    public typeId = 0;
    public level = 1;
    public customSkills: Array<Skill> = [];
    public health: Health = new Health();
    public conditions: Array<ConditionGain> = [];
    public effects: Array<EffectGain> = [];
    public ignoredEffects: Array<Effect> = [];
    public inventories: Array<ItemCollection> = [new ItemCollection()];
    public speeds: Array<Speed> = [new Speed('Speed'), new Speed('Land Speed')];
    public notes = '';
    public skillNotes: Array<SkillNotes> = [];
    public get requiresConForHP(): boolean { return false; }

    public recast(restoreFn: <T extends Item>(obj: T) => T): Creature {
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        this.health = Object.assign(new Health(), this.health).recast();
        this.conditions = this.conditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.inventories = this.inventories.map(obj => Object.assign(new ItemCollection(), obj).recast(restoreFn));
        this.speeds = this.speeds.map(obj => Object.assign(new Speed(), obj).recast());

        return this;
    }

    public isAnimalCompanion(): this is AnimalCompanion {
        return false;
    }

    public isCharacter(): this is Character {
        return false;
    }

    public isFamiliar(): this is Familiar {
        return false;
    }

    public abstract clone(restoreFn: <T extends Item>(obj: T) => T): Creature;

    public abstract baseSize(): number;

    public abstract baseHP(charLevel: number, conModifier: number): { result: number; explain: string };

    public abstract baseSpeed(speedName: string): { result: number; explain: string };

    public abstract abilityBoosts(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName?: string,
        type?: string,
        source?: string,
        sourceId?: string,
        locked?: boolean,
    ): Array<AbilityBoost>;

    public abstract skillIncreases(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName?: string,
        source?: string,
        sourceId?: string,
        locked?: boolean,
        excludeTemporary?: boolean,
    ): Array<SkillIncrease>;
}

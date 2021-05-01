import { ItemCollection } from './ItemCollection';
import { Health } from './Health';
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { ConditionGain } from './ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { EffectGain } from './EffectGain';
import { Skill } from './Skill';

export class Creature {
    public name: string = "";
    public id = uuidv4();
    public type: string = "";
    public level: number = 1;
    public customSkills: Skill[] = [];
    public health: Health = new Health();
    public conditions: ConditionGain[] = [];
    public effects: EffectGain[] = [];
    public inventories: ItemCollection[] = [new ItemCollection()];
    public speeds: Speed[] = [new Speed("Speed"), new Speed("Land Speed")];
    public bulk: Bulk = new Bulk();
    public notes: string = "";
}
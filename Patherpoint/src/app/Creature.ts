import { ItemCollection } from './ItemCollection';
import { Health } from './Health';
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { ConditionGain } from './ConditionGain';
import { v1 as uuidv1 } from 'uuid';

export class Creature {
    public name: string = "";
    public id = uuidv1();
    public type: string = "";
    public level: number = 1;
    public health: Health = new Health();
    public conditions: ConditionGain[] = [];
    public inventory: ItemCollection = new ItemCollection();
    public speeds: Speed[] = [new Speed("Speed"), new Speed("Land Speed")];
    public bulk: Bulk = new Bulk();
    public cover: number = 0;
}
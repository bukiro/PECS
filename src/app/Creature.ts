import { ItemCollection } from './ItemCollection';
import { Health } from './Health';
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { ConditionGain } from './ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { EffectGain } from './EffectGain';
import { Skill } from './Skill';
import { Effect } from './Effect';
import { TypeService } from './type.service';
import { ItemsService } from './items.service';

export class Creature {
    public name: string = "";
    public id = uuidv4();
    public type: string = "";
    public level: number = 1;
    public customSkills: Skill[] = [];
    public health: Health = new Health();
    public conditions: ConditionGain[] = [];
    public effects: EffectGain[] = [];
    public ignoredEffects: Effect[] = [];
    public inventories: ItemCollection[] = [new ItemCollection()];
    public speeds: Speed[] = [new Speed("Speed"), new Speed("Land Speed")];
    public bulk: Bulk = new Bulk();
    public notes: string = "";
    public skillNotes: { name: string, showNotes: boolean, notes: string }[] = [];
    recast(typeService: TypeService, itemsService: ItemsService) {
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        this.health = Object.assign(new Health(), this.health).recast();
        this.conditions = this.conditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.inventories = this.inventories.map(obj => Object.assign(new ItemCollection(), obj).recast(typeService, itemsService));
        this.speeds = this.speeds.map(obj => Object.assign(new Speed(), obj).recast());
        this.bulk = Object.assign(new Bulk(), this.bulk).recast();
        return this;
    }
}
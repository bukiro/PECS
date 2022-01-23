import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Health } from 'src/app/classes/Health';
import { Speed } from 'src/app/classes/Speed';
import { Bulk } from 'src/app/classes/Bulk';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Skill } from 'src/app/classes/Skill';
import { Effect } from 'src/app/classes/Effect';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

export class Creature {
    public name: string = "";
    public id = uuidv4();
    public type: "Character"|"Companion"|"Familiar" = "Character";
    public typeId: number = 0;
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
    get_EffectsGenerationObjects(characterService?) {
        //Each kind of creature provides its own version of this.
        return { feats: [], hintSets: [] };
    }
}
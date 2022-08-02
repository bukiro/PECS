import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Health } from 'src/app/classes/Health';
import { Speed } from 'src/app/classes/Speed';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Skill } from 'src/app/classes/Skill';
import { Effect } from 'src/app/classes/Effect';
import { ItemsService } from 'src/app/services/items.service';
import { EffectsService } from 'src/app/services/effects.service';
import { CreatureSizeName } from '../../libs/shared/util/creatureUtils';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';

export interface SkillNotes {
    name: string;
    showNotes: boolean;
    notes: string;
}

export class Creature {
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
    public recast(itemsService: ItemsService): Creature {
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        this.health = Object.assign(new Health(), this.health).recast();
        this.conditions = this.conditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.inventories = this.inventories.map(obj => Object.assign(new ItemCollection(), obj).recast(itemsService));
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
    public baseSize(): number {
        //Each kind of creature provides its own version of this.
        return 0;
    }
    public effectiveSize(effectsService: EffectsService, options: { asNumber?: boolean } = {}): string | number {
        let size: number = this.baseSize();

        const setSizeEffects = effectsService.absoluteEffectsOnThis(this, 'Size');

        if (setSizeEffects.length) {
            size = Math.max(...setSizeEffects.map(effect => parseInt(effect.setValue, 10)));
        }

        const sizeEffects = effectsService.relativeEffectsOnThis(this, 'Size');

        sizeEffects.forEach(effect => {
            size += parseInt(effect.value, 10);
        });

        if (options.asNumber) {
            return size;
        } else {
            return CreatureSizeName(size);
        }
    }
    //Other implementations require characterService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public baseHP(conModifier: number, charLevel: number): { result: number; explain: string } {
        return { result: 0, explain: '' };
    }
    //Other implementations require speedName.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public baseSpeed(speedName: string): { result: number; explain: string } {
        return { result: 0, explain: '' };
    }
}

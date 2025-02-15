import { v4 as uuidv4 } from 'uuid';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { Alignments } from 'src/libs/shared/definitions/alignments';
import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ConditionGain } from '../conditions/condition-gain';
import { Effect } from '../effects/effect';
import { EffectGain } from '../effects/effect-gain';
import { ItemCollection } from '../items/item-collection';
import { Skill } from '../skills/skill';
import { SkillIncrease } from '../skills/skill-increase';
import { AnimalCompanion } from './animal-companion/animal-companion';
import { Character } from './character/character';
import { Familiar } from './familiar/familiar';
import { Health } from './health';
import { Speed } from './speed';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { computed, Signal, signal } from '@angular/core';

export interface SkillNotes {
    name: string;
    showNotes: boolean;
    notes: string;
}

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Creature>({
    primitives: [
        'id',
        'notes',
        'alignment',
        'level',
        'name',
    ],
    primitiveObjectArrays: [
        'skillNotes',
    ],
    serializables: {
        health:
            () => obj => Health.from(obj),
    },
    serializableArrays: {
        conditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        customSkills:
            () => obj => Skill.from(obj),
        effects:
            () => obj => EffectGain.from(obj),
        ignoredEffects:
            () => obj => Effect.from(obj),
        inventories:
            recastFns => obj => ItemCollection.from(obj, recastFns),
        speeds:
            () => obj => Speed.from(obj),
    },
});

export abstract class Creature implements Serializable<Creature> {
    public id = uuidv4();
    public type: CreatureTypes = CreatureTypes.Character;
    public typeId: CreatureTypeIds = CreatureTypeIds.Character;
    public notes = '';

    public skillNotes: Array<SkillNotes> = [];

    public health: Health = new Health();

    public ignoredEffects: Array<Effect> = [];

    public readonly conditions = signal<Array<ConditionGain>>([]);
    public readonly alignment = signal(Alignments.N);
    public readonly level = signal(1);
    public readonly name = signal('');

    public readonly effects = signal<Array<EffectGain>>([]);
    public readonly inventories = signal<Array<ItemCollection>>([new ItemCollection()]);
    public readonly speeds = signal<Array<Speed>>([
        new Speed('Speed'),
        new Speed('Land Speed'),
    ]);
    public readonly customSkills = signal<Array<Skill>>([]);

    public readonly mainInventory$$ = computed(() => {
        const mainInventory = this.inventories()[0] ?? new ItemCollection();

        if (!this.inventories()[0]) {
            this.inventories.set([mainInventory]);
        }

        return mainInventory;
    });

    protected readonly _areInventoriesTouched$$ = computed(() =>
        this.inventories().some(inventory => inventory.touched()),
    );

    public abstract readonly baseSize$$: Signal<number>;

    public get requiresConForHP(): boolean { return false; }

    public with(values: MaybeSerialized<Creature>, recastFns: RecastFns): Creature {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Creature> {
        return {
            ...forExport(this),
        };
    }

    public isEqual(compared: Partial<Creature>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
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

    public canEquipItems(): this is AnimalCompanion | Character {
        return false;
    }

    public abstract clone(recastFns: RecastFns): Creature;

    public abstract baseHP$$(charLevel: number, conModifier: number): Signal<{ result: number; bonuses: Array<BonusDescription> }>;

    public abstract baseSpeed$$(speedName: string): Signal<{ result: number; explain: string }>;

    public abstract abilityBoosts$$(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName?: string,
        type?: string,
        source?: string,
        sourceId?: string,
        locked?: boolean,
    ): Signal<Array<AbilityBoost>>;

    public abstract skillIncreases$$(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName?: string,
        source?: string,
        sourceId?: string,
        locked?: boolean,
        excludeTemporary?: boolean,
    ): Signal<Array<SkillIncrease>>;
}

import { v4 as uuidv4 } from 'uuid';
import { computed, Signal, signal } from '@angular/core';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { CreatureTypeIds } from './creature-type-ids';
import { CreatureTypes } from './creature-types';
import { Health } from 'src/libs/shared/health/util/models/health';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { ItemCollection } from 'src/libs/shared/items/util/models/item-collection';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { Alignments } from 'src/libs/shared/alignment/util/models/alignments';
import { AnimalCompanion } from './animal-companion';
import { Character } from '../../../character/util/models/character';
import { Familiar } from './familiar';
import { CreatureConditionsAdapter } from 'src/libs/shared/conditions/util/utils/creature-conditions-adapter';
import { CreatureEffectsAdapter } from 'src/libs/shared/effects/util/utils/creature-effects-adapter';
import { CreatureFeatsAdapter } from 'src/libs/shared/feats/util/utils/creature-feats-adapter/creature-feats-adapter';
import { NullCreatureFeatsAdapter } from 'src/libs/shared/feats/util/utils/creature-feats-adapter/null-creature-feats-adapter';
import { CreatureAbilitiesAdapter } from 'src/libs/shared/abilities/util/utils/creature-abilities-adapter/creature-abilities-adapter';
import { NullCreatureAbilitiesAdapter } from 'src/libs/shared/abilities/util/utils/creature-abilities-adapter/null-creature-abilities-adapter';
import { CreatureSkillsAdapter } from 'src/libs/shared/skills/util/utils/creature-skills-adapter/creature-skills-adapter';
import { CreatureHealthAdapter } from 'src/libs/shared/health/util/utils/creature-health-adapter/creature-health-adapter';
import { CreatureSizeAdapter } from 'src/libs/shared/size/util/utils/creature-size-adapter/creature-size-adapter';
import { CreatureActivitiesAdapter } from 'src/libs/shared/activities/util/creature-acitivies-adapter/creature-activities-adapter';
import { CreatureSensesAdapter } from 'src/libs/shared/senses/util/utils/creature-senses-adapter/creature-senses-adapter';
import { CreatureSpeedsAdapter } from 'src/libs/shared/speed/util/utils/creature-speeds-adapter/creature-speeds-adapter';
import { CreatureMagicAdapter } from 'src/libs/shared/spells/util/utils/creature-spell-casting-adapter/creature-magic-adapter';

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
    },
});

export abstract class Creature implements Serializable<Creature> {
    public id = uuidv4();
    public type: CreatureTypes = CreatureTypes.Character;
    public typeId: CreatureTypeIds = CreatureTypeIds.Character;
    public notes = '';

    public skillNotes: Array<SkillNotes> = [];

    public health: Health = new Health();

    public ignoredEffects = signal<Array<Effect>>([]);

    public readonly abilitiesAdapter: CreatureAbilitiesAdapter = new NullCreatureAbilitiesAdapter();
    public readonly conditionsAdapter: CreatureConditionsAdapter;
    public readonly effectsAdapter: CreatureEffectsAdapter;
    public readonly featsAdapter: CreatureFeatsAdapter = new NullCreatureFeatsAdapter();

    public readonly conditions = signal<Array<ConditionGain>>([]);
    public readonly alignment = signal<Alignments>('Neutral');
    public readonly name = signal('');

    public readonly effects = signal<Array<EffectGain>>([]);
    public readonly inventories = signal<Array<ItemCollection>>([new ItemCollection()]);
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

    public abstract readonly level: Signal<number>;

    public abstract readonly activitiesAdapter: CreatureActivitiesAdapter;
    public abstract readonly healthAdapter: CreatureHealthAdapter;
    public abstract readonly sensesAdapter: CreatureSensesAdapter;
    public abstract readonly sizeAdapter: CreatureSizeAdapter;
    public abstract readonly skillsAdapter: CreatureSkillsAdapter;
    public abstract readonly speedsAdapter: CreatureSpeedsAdapter;
    public abstract readonly magicAdapter: CreatureMagicAdapter;

    constructor() {
        this.conditionsAdapter = new CreatureConditionsAdapter(this);
        this.effectsAdapter = new CreatureEffectsAdapter(this);
    }

    public get requiresConForHP(): boolean { return false; }

    public with(values: MaybeSerialized<Creature>, recastFns: RecastFns): this {
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

    public levelOrCurrent$$(levelNumber?: number): Signal<number> {
        if (levelNumber === undefined) {
            return this.level;
        }

        return signal(levelNumber).asReadonly();
    }

    public abstract clone(recastFns: RecastFns): this;
}

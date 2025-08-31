import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { Creature } from './creature';
import { CreatureTypeIds } from './creature-type-ids';
import { CreatureTypes } from './creature-types';
import { AnimalCompanionClass } from 'src/libs/shared/animal-companion/util/models/animal-companion-class';
import { matchNumberFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { DefaultCreatureAbilitiesAdapter } from 'src/libs/shared/abilities/util/utils/creature-abilities-adapter/default-creature-abilities-adapter';
import { Character } from '../../../character/util/models/character';
import { AnimalCompanionSpecialization } from 'src/libs/shared/feats/util/models/animal-companion-specialization';
import { DefaultCreatureSkillsAdapter } from 'src/libs/shared/skills/util/utils/creature-skills-adapter/default-creature-skills-adapter';
import { AnimalCompanionEvolutionAdapter } from 'src/libs/shared/animal-companion/util/utils/animal-companion-levels-adapter/animal-companion-evolution-adapter';
import { CreatureHealthAdapter } from 'src/libs/shared/health/util/utils/creature-health-adapter/creature-health-adapter';
import { AnimalCompanionSizeAdapter } from 'src/libs/shared/size/util/utils/creature-size-adapter/animal-companion-size-adapter';
import { CreatureActivitiesAdapter } from 'src/libs/shared/activities/util/creature-acitivies-adapter/creature-activities-adapter';
import { CreatureSensesAdapter } from 'src/libs/shared/senses/util/utils/creature-senses-adapter/creature-senses-adapter';
import { CreatureSpeedsAdapter } from 'src/libs/shared/speed/util/utils/creature-speeds-adapter/creature-speeds-adapter';
import { DefaultCreatureMagicAdapter } from 'src/libs/shared/spells/util/utils/creature-spell-casting-adapter/default-creature-magic-adapter';
import { CreatureMagicAdapter } from 'src/libs/shared/spells/util/utils/creature-spell-casting-adapter/creature-magic-adapter';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<AnimalCompanion>({
    primitives: [
        'species',
    ],
    serializables: {
        class:
            recastFns => obj => AnimalCompanionClass.from(obj, recastFns),
    },
});

export class AnimalCompanion extends Creature implements Serializable<AnimalCompanion> {
    public readonly type: CreatureTypes = CreatureTypes.AnimalCompanion;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.AnimalCompanion;

    public readonly abilitiesAdapter;
    public readonly activitiesAdapter: CreatureActivitiesAdapter;
    public readonly evolutionAdapter;
    public readonly healthAdapter;
    public readonly sensesAdapter;
    public readonly skillsAdapter;
    public readonly sizeAdapter;
    public readonly speedsAdapter;
    public readonly magicAdapter: CreatureMagicAdapter;

    public readonly level: Signal<number>;
    public readonly class: WritableSignal<AnimalCompanionClass>;
    public readonly species = signal('');

    public readonly customSkills = signal<Array<Skill>>([
        new Skill('', 'Light Barding', 'Armor Proficiency'),
        new Skill('', 'Heavy Barding', 'Armor Proficiency'),
    ]);


    private readonly _cache = {
        specializationsAtCharacterLevel: new Map<string | number, Signal<Array<AnimalCompanionSpecialization>>>(),
    };

    constructor(
        recastFns: RecastFns,
        private readonly _character: Character,
    ) {
        super();

        this.abilitiesAdapter = new DefaultCreatureAbilitiesAdapter(this, recastFns);
        this.activitiesAdapter = new CreatureActivitiesAdapter(this, recastFns);
        this.evolutionAdapter = new AnimalCompanionEvolutionAdapter(this, _character);
        this.healthAdapter = new CreatureHealthAdapter(this);
        this.sensesAdapter = new CreatureSensesAdapter(this);
        this.skillsAdapter = new DefaultCreatureSkillsAdapter(this, recastFns);
        this.sizeAdapter = new AnimalCompanionSizeAdapter(this);
        this.speedsAdapter = new CreatureSpeedsAdapter(this);
        this.magicAdapter = new DefaultCreatureMagicAdapter(this, _character, recastFns);

        this.level = this._character.level.asReadonly();
        this.class = signal(new AnimalCompanionClass(recastFns));
    }

    public get requiresConForHP(): boolean { return true; }

    public static from(values: MaybeSerialized<AnimalCompanion>, recastFns: RecastFns, character: Character): AnimalCompanion {
        return new AnimalCompanion(recastFns, character).with(values, recastFns);
    }

    public with(values: MaybeSerialized<AnimalCompanion>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<AnimalCompanion> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return AnimalCompanion.from(this, recastFns, this._character) as this;
    }

    public isEqual(compared: Partial<AnimalCompanion>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAnimalCompanion(): this is AnimalCompanion {
        return true;
    }

    public canEquipItems(): this is AnimalCompanion {
        return true;
    }

    public specializationsAtCharacterLevel$$(charLevel?: number): Signal<Array<AnimalCompanionSpecialization>> {
        return cachedSignal(
            () => {
                const effectiveCharLevel$$ = this.levelOrCurrent$$(charLevel);

                return computed(() => {
                    const effectiveMaxLevel = effectiveCharLevel$$();

                    return this.class().specializations()
                        .filter(spec => matchNumberFilter({ value: spec.level, max: effectiveMaxLevel }));
                });
            },
            { store: this._cache.specializationsAtCharacterLevel, key: charLevel ?? 'noLevel' },
        );
    }
}

import { signal, Signal } from '@angular/core';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { Creature } from './creature';
import { CreatureTypeIds } from './creature-type-ids';
import { CreatureTypes } from './creature-types';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { DefaultCreatureFeatsAdapter } from 'src/libs/shared/feats/util/utils/creature-feats-adapter/default-creature-feats-adapter';
import { FamiliarSkillsAdapter } from 'src/libs/shared/skills/util/utils/creature-skills-adapter/familiar-skills-adapter';
import { Character } from '../../../character/util/models/character';
import { CreatureHealthAdapter } from 'src/libs/shared/health/util/utils/creature-health-adapter/creature-health-adapter';
import { FamiliarSizeAdapter } from 'src/libs/shared/size/util/utils/creature-size-adapter/familiar-size-adapter';
import { CreatureActivitiesAdapter } from 'src/libs/shared/activities/util/creature-acitivies-adapter/creature-activities-adapter';
import { CreatureSensesAdapter } from 'src/libs/shared/senses/util/utils/creature-senses-adapter/creature-senses-adapter';
import { CreatureSpeedsAdapter } from 'src/libs/shared/speed/util/utils/creature-speeds-adapter/creature-speeds-adapter';
import { Speed } from 'src/libs/shared/speed/util/models/speed';
import { DefaultCreatureMagicAdapter } from 'src/libs/shared/spells/util/utils/creature-spell-casting-adapter/default-creature-magic-adapter';
import { CreatureMagicAdapter } from 'src/libs/shared/spells/util/utils/creature-spell-casting-adapter/creature-magic-adapter';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Familiar>({
    primitives: [
        'originClass',
        'species',
    ],
    primitiveArrays: [
        'senses',
        'traits',
    ],
    serializableArrays: {
        customSkills:
            () => obj => Skill.from(obj),
        speeds:
            () => obj => Speed.from({ ...obj, source: 'Familiar', value: obj.value ?? Defaults.defaultFamiliarSpeed }),
    },
});

export class Familiar extends Creature implements Serializable<Familiar> {
    public readonly type: CreatureTypes = CreatureTypes.Familiar;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.Familiar;

    public originClass = '';
    public readonly level: Signal<number>;
    public species = signal('');

    public senses = signal(['Low-Light Vision']);
    public traits: Array<string> = ['Minion'];

    public abilities: FeatChoice = FeatChoice.from(
        {
            available: Defaults.familiarAbilities,
            id: '0-Feat-Familiar-0',
            source: 'Familiar',
            type: 'Familiar',
        },
        RecastService.recastFns,
    );

    public readonly activitiesAdapter: CreatureActivitiesAdapter;
    public readonly featsAdapter;
    public readonly healthAdapter;
    public readonly sensesAdapter;
    public readonly skillsAdapter;
    public readonly sizeAdapter;
    public readonly speedsAdapter;
    public readonly magicAdapter: CreatureMagicAdapter;

    public readonly customSkills = signal([
        Skill.from({ name: 'Attack Rolls', type: 'Familiar Proficiency' }),
    ]);

    // TODO: Patch the "Speeds" speed out of this list on older characters.
    public readonly speeds = signal<Array<Speed>>([
        new Speed().with({ name: 'Land Speed', source: 'Familiar', value: Defaults.defaultFamiliarSpeed }),
    ]);

    private readonly _cache = {
        baseSpeed: new Map<string, Signal<{ result: number; explain: string }>>(),
    };

    constructor(
        recastFns: RecastFns,
        private readonly _character: Character,
    ) {
        super();

        this.activitiesAdapter = new CreatureActivitiesAdapter(this, recastFns);
        this.featsAdapter = new DefaultCreatureFeatsAdapter(this, _character, recastFns);
        this.healthAdapter = new CreatureHealthAdapter(this);
        this.sensesAdapter = new CreatureSensesAdapter(this);
        this.skillsAdapter = new FamiliarSkillsAdapter(this, _character, recastFns);
        this.sizeAdapter = new FamiliarSizeAdapter(this);
        this.speedsAdapter = new CreatureSpeedsAdapter(this);
        this.magicAdapter = new DefaultCreatureMagicAdapter(this, _character, recastFns);

        this.level = _character.level.asReadonly();
    }

    public get requiresConForHP(): boolean { return false; }

    public static from(values: MaybeSerialized<Familiar>, recastFns: RecastFns, character: Character): Familiar {
        return new Familiar(recastFns, character).with(values, recastFns);
    }

    public with(values: MaybeSerialized<Familiar>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Familiar> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Familiar.from(this, recastFns, this._character) as this;
    }

    public isEqual(compared: Partial<Familiar>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isFamiliar(): this is Familiar {
        return true;
    }
}

import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

const { assign, forExport, isEqual } = setupSerialization<Skill>({
    primitives: [
        'notes',
        'showNotes',
        'showEffects',
        'ability',
        'name',
        'type',
        'locked',
        'recallKnowledge',
    ],
});

export class Skill implements Serializable<Skill> {
    public notes = '';
    public showNotes = false;
    public showEffects = false;
    constructor(
        public ability: string = '',
        public name: string = '',
        public type: string = '',
        //Locked skills don't show up in skill increase choices.
        public locked: boolean = false,
        public recallKnowledge: boolean = false,
    ) { }

    public static from(values: MaybeSerialized<Skill>): Skill {
        return new Skill().with(values);
    }

    public with(values: MaybeSerialized<Skill>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Skill> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Skill.from(this) as this;
    }

    public isEqual(compared: Partial<Skill>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

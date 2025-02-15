import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

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

    public with(values: MaybeSerialized<Skill>): Skill {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Skill> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Skill {
        return Skill.from(this);
    }

    public isEqual(compared: Partial<Skill>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

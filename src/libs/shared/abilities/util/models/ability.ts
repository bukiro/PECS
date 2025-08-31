import { MaybeSerialized } from 'src/libs/shared/serialization/util/models/serializable';

export class Ability {
    constructor(
        public name: string = '',
        public modifierName: string = '',
    ) { }

    public static from(values: MaybeSerialized<Ability>): Ability {
        return new Ability(values.name, values.modifierName);
    }
}

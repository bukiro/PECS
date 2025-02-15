import { MaybeSerialized } from 'src/libs/shared/definitions/interfaces/serializable';

export class Ability {
    constructor(
        public name: string = '',
        public modifierName: string = '',
    ) { }

    public static from(values: MaybeSerialized<Ability>): Ability {
        return new Ability(values.name, values.modifierName);
    }
}

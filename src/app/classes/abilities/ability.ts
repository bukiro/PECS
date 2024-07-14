import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

export class Ability {
    constructor(
        public name: string = '',
        public modifierName: string = '',
    ) { }

    public static from(values: DeepPartial<Ability>): Ability {
        return new Ability(values.name, values.modifierName);
    }
}

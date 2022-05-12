import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

export class SpellTarget {
    public name = '';
    public id = '';
    public playerId = '';
    public type: CreatureTypes = CreatureTypes.Character;
    public selected = false;
    public isPlayer = false;
    public recast(): SpellTarget {
        return this;
    }
}

import { Consumable } from 'src/app/classes/Consumable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { SpellCast } from './SpellCast';

export class Potion extends Consumable {
    //Potions should be type "potions" to be found in the database
    public readonly type = 'potions';
    public castSpells: Array<SpellCast> = [];

    public recast(recastFns: RecastFns): Potion {
        super.recast(recastFns);
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());

        return this;
    }

    public canCastSpells(): this is Potion { return true; }

    public clone(recastFns: RecastFns): Potion {
        return Object.assign<Potion, Potion>(new Potion(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }
}
